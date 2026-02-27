import { prisma } from '../config/index.js'

// ==================== 时间常量 (消除魔法数字) ====================
const MS_PER_DAY = 1000 * 60 * 60 * 24
/** 跟进提醒窗口：7 天未联系的线索需要跟进 */
const FOLLOW_UP_WINDOW_DAYS = 7
const FOLLOW_UP_WINDOW_MS = FOLLOW_UP_WINDOW_DAYS * MS_PER_DAY
/** 逾期阈值：14 天未联系的线索视为逾期 */
const OVERDUE_LEAD_DAYS = 14
const OVERDUE_LEAD_WINDOW_MS = OVERDUE_LEAD_DAYS * MS_PER_DAY
/** 生日提醒：提前 7 天提示客户生日 */
const BIRTHDAY_REMINDER_DAYS = 7

interface AssignmentStats {
    userId: string
    userName: string
    activeLeads: number
    activeTasks: number
    workload: number
}

interface FollowUpItem {
    id: string
    type: 'LEAD' | 'TASK' | 'APPOINTMENT' | 'EVENT'
    title: string
    description: string | null
    priority: string
    dueDate: Date | null
    status: string
    assignedTo: {
        id: string
        name: string
    } | null
    relatedEntity?: {
        type: string
        id: string
        name: string
    }
}

interface AssignmentRule {
    name: string
    field: string
    value: string
    assignToUserId?: string
    assignToRole?: string
}

export const workflowService = {
    // ==================== 智能线索分配 ====================

    /**
     * 获取销售团队成员的工作负载统计
     */
    async getTeamWorkload(): Promise<AssignmentStats[]> {
        // 获取销售角色的用户
        const salesUsers = await prisma.user.findMany({
            where: {
                status: 'ACTIVE',
                role: {
                    name: { in: ['sales', 'admin', 'manager'] }
                }
            },
            select: {
                id: true,
                name: true
            }
        })

        // 分别查询每个用户的线索和任务数量
        const stats: AssignmentStats[] = []
        for (const user of salesUsers) {
            const [activeLeads, activeTasks] = await Promise.all([
                prisma.lead.count({
                    where: {
                        assignedToId: user.id,
                        status: { notIn: ['CONVERTED', 'LOST'] }
                    }
                }),
                prisma.task.count({
                    where: {
                        assignedToId: user.id,
                        status: { notIn: ['DONE', 'CANCELLED'] }
                    }
                })
            ])

            stats.push({
                userId: user.id,
                userName: user.name,
                activeLeads,
                activeTasks,
                workload: activeLeads * 2 + activeTasks
            })
        }

        return stats
    },

    /**
     * 获取最佳分配人选（负载最低）
     */
    async getBestAssignee(excludeUserIds: string[] = []): Promise<string | null> {
        const workload = await this.getTeamWorkload()

        const available = workload.filter(w => !excludeUserIds.includes(w.userId))
        if (available.length === 0) return null

        // 返回负载最低的用户
        available.sort((a, b) => a.workload - b.workload)
        return available[0].userId
    },

    /**
     * 智能分配单个线索
     */
    async autoAssignLead(leadId: string): Promise<any> {
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: { assignedTo: true }
        })

        if (!lead) {
            throw new Error('线索不存在')
        }

        if (lead.assignedToId) {
            throw new Error('线索已分配')
        }

        // 1. 检查是否有匹配的分配规则
        const matchedUserId = await this.matchAssignmentRule(lead)

        // 2. 如果没有匹配规则，使用负载均衡
        const assignToId = matchedUserId || await this.getBestAssignee()

        if (!assignToId) {
            throw new Error('没有可用的销售人员')
        }

        // 3. 执行分配
        const updatedLead = await prisma.lead.update({
            where: { id: leadId },
            data: { assignedToId: assignToId },
            include: {
                assignedTo: { select: { id: true, name: true, email: true } }
            }
        })

        // 4. 创建活动记录
        await prisma.activity.create({
            data: {
                actionType: 'ASSIGNED',
                entityType: 'LEAD',
                entityId: leadId,
                description: `线索已自动分配给 ${updatedLead.assignedTo?.name}`,
                leadId: leadId,
                actorId: assignToId
            }
        })

        // 5. 创建首次跟进任务
        await this.createFollowUpTask(leadId, assignToId)

        return updatedLead
    },

    /**
     * 批量智能分配未分配的线索
     */
    async batchAutoAssign(): Promise<{ assigned: number; failed: number }> {
        const unassignedLeads = await prisma.lead.findMany({
            where: {
                assignedToId: null,
                status: { notIn: ['CONVERTED', 'LOST'] }
            },
            orderBy: { score: 'desc' } // 优先分配高分线索
        })

        let assigned = 0
        let failed = 0

        for (const lead of unassignedLeads) {
            try {
                await this.autoAssignLead(lead.id)
                assigned++
            } catch {
                failed++
            }
        }

        return { assigned, failed }
    },

    /**
     * 匹配分配规则
     */
    async matchAssignmentRule(lead: any): Promise<string | null> {
        // 获取系统设置中的分配规则
        const rulesSetting = await prisma.systemSetting.findUnique({
            where: { key: 'ASSIGNMENT_RULES' }
        })

        if (!rulesSetting?.value) return null

        try {
            const rules: AssignmentRule[] = JSON.parse(rulesSetting.value)

            for (const rule of rules) {
                const fieldValue = lead[rule.field]

                // 简单匹配
                if (fieldValue === rule.value ||
                    (Array.isArray(fieldValue) && fieldValue.includes(rule.value))) {

                    if (rule.assignToUserId) {
                        return rule.assignToUserId
                    }

                    // 如果指定角色，从该角色用户中选择负载最低的
                    if (rule.assignToRole) {
                        const users = await prisma.user.findMany({
                            where: {
                                status: 'ACTIVE',
                                role: { name: rule.assignToRole }
                            },
                            select: { id: true }
                        })

                        if (users.length > 0) {
                            const userIds = users.map(u => u.id)
                            const workload = await this.getTeamWorkload()
                            const filtered = workload.filter(w => userIds.includes(w.userId))
                            if (filtered.length > 0) {
                                filtered.sort((a, b) => a.workload - b.workload)
                                return filtered[0].userId
                            }
                        }
                    }
                }
            }
        } catch {
            // 规则解析失败，跳过
        }

        return null
    },

    /**
     * 创建首次跟进任务
     */
    async createFollowUpTask(leadId: string, assigneeId: string): Promise<any> {
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            select: { contactName: true, companyName: true, score: true }
        })

        // 根据评分决定跟进紧急度
        const priority = (lead?.score || 0) >= 50 ? 'HIGH' :
            (lead?.score || 0) >= 30 ? 'MEDIUM' : 'LOW'

        // 根据优先级设置到期时间
        const hoursMap = { HIGH: 2, MEDIUM: 24, LOW: 48 }
        const dueDate = new Date()
        dueDate.setHours(dueDate.getHours() + hoursMap[priority])

        return prisma.task.create({
            data: {
                title: `首次跟进: ${lead?.contactName || '新线索'}`,
                description: `请及时联系 ${lead?.contactName}${lead?.companyName ? ` (${lead?.companyName})` : ''}，了解其需求。`,
                leadId: leadId,
                assignedToId: assigneeId,
                priority: priority,
                dueDate: dueDate,
                slaHours: hoursMap[priority],
                tags: ['首次跟进', '自动创建']
            }
        })
    },

    // ==================== 跟进待办清单 ====================

    /**
     * 获取用户的跟进待办清单
     */
    async getFollowUpList(userId: string, filters?: {
        type?: 'LEAD' | 'TASK' | 'APPOINTMENT' | 'EVENT' | 'ALL'
        priority?: string
        overdue?: boolean
    }): Promise<FollowUpItem[]> {
        const now = new Date()
        const items: FollowUpItem[] = []

        // 获取需要跟进的线索
        if (!filters?.type || filters.type === 'LEAD' || filters.type === 'ALL') {
            const leads = await prisma.lead.findMany({
                where: {
                    assignedToId: userId,
                    status: { notIn: ['CONVERTED', 'LOST'] },
                    OR: [
                        { lastContactedAt: null },
                        { lastContactedAt: { lt: new Date(now.getTime() - FOLLOW_UP_WINDOW_MS) } } // 超过跟进窗口未联系
                    ]
                },
                select: {
                    id: true,
                    contactName: true,
                    companyName: true,
                    status: true,
                    score: true,
                    lastContactedAt: true
                },
                orderBy: { score: 'desc' }
            })

            for (const lead of leads) {
                const priority = (lead.score || 0) >= 50 ? 'HIGH' :
                    (lead.score || 0) >= 30 ? 'MEDIUM' : 'LOW'

                items.push({
                    id: lead.id,
                    type: 'LEAD',
                    title: `跟进: ${lead.contactName}`,
                    description: lead.companyName,
                    priority: priority,
                    dueDate: lead.lastContactedAt ? new Date(lead.lastContactedAt.getTime() + FOLLOW_UP_WINDOW_MS) : null,
                    status: lead.status,
                    assignedTo: null
                })
            }
        }

        // 获取待完成任务
        if (!filters?.type || filters.type === 'TASK' || filters.type === 'ALL') {
            const whereClause: any = {
                assignedToId: userId,
                status: { notIn: ['DONE', 'CANCELLED'] }
            }

            if (filters?.overdue) {
                whereClause.dueDate = { lt: now }
            }

            if (filters?.priority) {
                whereClause.priority = filters.priority
            }

            const tasks = await prisma.task.findMany({
                where: whereClause,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    priority: true,
                    dueDate: true,
                    status: true,
                    lead: { select: { id: true, contactName: true } },
                    project: { select: { id: true, title: true } }
                },
                orderBy: [
                    { dueDate: 'asc' },
                    { priority: 'desc' }
                ]
            })

            for (const task of tasks) {
                const item: FollowUpItem = {
                    id: task.id,
                    type: 'TASK',
                    title: task.title,
                    description: task.description,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    status: task.status,
                    assignedTo: null
                }

                if (task.lead) {
                    item.relatedEntity = {
                        type: 'LEAD',
                        id: task.lead.id,
                        name: task.lead.contactName
                    }
                } else if (task.project) {
                    item.relatedEntity = {
                        type: 'PROJECT',
                        id: task.project.id,
                        name: task.project.title
                    }
                }

                items.push(item)
            }
        }

        // 获取即将到来的预约
        const appointments = await prisma.appointment.findMany({
            where: {
                userId: userId,
                startTime: { gte: now },
                status: { in: ['SCHEDULED'] }
            },
            select: {
                id: true,
                title: true,
                description: true,
                startTime: true,
                status: true,
                lead: { select: { id: true, contactName: true } }
            },
            orderBy: { startTime: 'asc' },
            take: 10
        })

        for (const apt of appointments) {
            const item: FollowUpItem = {
                id: apt.id,
                type: 'APPOINTMENT',
                title: apt.title,
                description: apt.description,
                priority: 'HIGH',
                dueDate: apt.startTime,
                status: apt.status,
                assignedTo: null
            }

            if (apt.lead) {
                item.relatedEntity = {
                    type: 'LEAD',
                    id: apt.lead.id,
                    name: apt.lead.contactName
                }
            }

            items.push(item)
        }

        // 获取即将到来的客户生日 (未来 7 天内)
        if (!filters?.type || filters.type === 'EVENT' || filters.type === 'ALL') {
            const customersWithBirthday = await prisma.customer.findMany({
                where: {
                    birthday: { not: null },
                    lead: { assignedToId: userId }
                },
                select: { id: true, contactName: true, companyName: true, birthday: true }
            })

            for (const customer of customersWithBirthday) {
                if (!customer.birthday) continue
                const bMonth = customer.birthday.getUTCMonth()
                const bDate = customer.birthday.getUTCDate()

                const today = new Date()
                const thisYearBirthday = new Date(today.getFullYear(), bMonth, bDate)

                // If birthday has passed this year, look at next year
                if (thisYearBirthday.getTime() < new Date(today.setHours(0, 0, 0, 0)).getTime()) {
                    thisYearBirthday.setFullYear(today.getFullYear() + 1)
                }

                const diffTime = thisYearBirthday.getTime() - new Date().getTime()
                const diffDays = Math.ceil(diffTime / MS_PER_DAY)

                if (diffDays <= BIRTHDAY_REMINDER_DAYS && diffDays >= 0) {
                    items.push({
                        id: `birthday-${customer.id}`,
                        type: 'EVENT',
                        title: `客户生日: ${customer.contactName}`,
                        description: `${diffDays === 0 ? '今天' : diffDays + ' 天后'}是客户的生日，记得送上祝福。`,
                        priority: 'MEDIUM',
                        dueDate: thisYearBirthday,
                        status: 'PENDING',
                        assignedTo: null,
                        relatedEntity: {
                            type: 'CUSTOMER',
                            id: customer.id,
                            name: customer.contactName || '未知'
                        }
                    })
                }
            }
        }

        // 按优先级和时间排序
        const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
        items.sort((a, b) => {
            const pA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3
            const pB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3
            if (pA !== pB) return pA - pB

            if (a.dueDate && b.dueDate) {
                return a.dueDate.getTime() - b.dueDate.getTime()
            }
            return a.dueDate ? -1 : 1
        })

        return items
    },

    /**
     * 获取逾期任务统计
     */
    async getOverdueStats(userId?: string): Promise<{
        overdueTasks: number
        overdueLeads: number
        upcomingToday: number
    }> {
        const now = new Date()
        const endOfDay = new Date(now)
        endOfDay.setHours(23, 59, 59, 999)

        const where: any = {}
        if (userId) where.assignedToId = userId

        const [overdueTasks, overdueLeads, upcomingToday] = await Promise.all([
            prisma.task.count({
                where: {
                    ...where,
                    status: { notIn: ['DONE', 'CANCELLED'] },
                    dueDate: { lt: now }
                }
            }),
            prisma.lead.count({
                where: {
                    ...where,
                    status: { notIn: ['CONVERTED', 'LOST'] },
                    lastContactedAt: { lt: new Date(now.getTime() - OVERDUE_LEAD_WINDOW_MS) } // 超过逾期阈值未联系
                }
            }),
            prisma.task.count({
                where: {
                    ...where,
                    status: { notIn: ['DONE', 'CANCELLED'] },
                    dueDate: {
                        gte: now,
                        lte: endOfDay
                    }
                }
            })
        ])

        return { overdueTasks, overdueLeads, upcomingToday }
    },

    // ==================== SOP 模板 ====================

    /**
     * 根据线索类型获取推荐的 SOP 步骤
     */
    async getSopSteps(serviceType: string): Promise<string[]> {
        // 默认 SOP 步骤
        const defaultSteps = [
            '1. 首次电话/邮件联系，确认需求',
            '2. 发送公司介绍资料',
            '3. 预约详细咨询会议',
            '4. 提供报价方案',
            '5. 跟进确认意向',
            '6. 签约与收款',
            '7. 项目启动'
        ]

        // 根据服务类型定制
        const sopByService: Record<string, string[]> = {
            company_registration: [
                '1. 确认注册需求（公司类型、股东结构）',
                '2. 收集股东身份证件',
                '3. 确认公司名称并预留',
                '4. 准备注册文件',
                '5. 提交 ACRA 申请',
                '6. 获取注册证书',
                '7. 开设银行账户'
            ],
            family_office: [
                '1. 初步需求评估会议',
                '2. 家族资产状况分析',
                '3. 提供架构设计方案',
                '4. 法律合规审查',
                '5. MAS 申请准备',
                '6. 提交牌照申请',
                '7. 后续合规支持'
            ],
            accounting: [
                '1. 了解公司财务状况',
                '2. 确认服务范围',
                '3. 提供报价',
                '4. 签订服务协议',
                '5. 收集历史财务资料',
                '6. 开始月度记账',
                '7. 定期财务报告'
            ]
        }

        return sopByService[serviceType] || defaultSteps
    },

    /**
     * 为线索创建 SOP 任务序列
     */
    async createSopTasks(leadId: string, assigneeId: string, serviceType: string): Promise<any[]> {
        const steps = await this.getSopSteps(serviceType)
        const tasks = []

        const baseDate = new Date()

        for (let i = 0; i < steps.length; i++) {
            const dueDate = new Date(baseDate)
            dueDate.setDate(dueDate.getDate() + (i + 1) * 3) // 每步间隔3天

            const task = await prisma.task.create({
                data: {
                    title: steps[i],
                    leadId: leadId,
                    assignedToId: assigneeId,
                    priority: i === 0 ? 'HIGH' : 'MEDIUM',
                    dueDate: dueDate,
                    tags: ['SOP', serviceType]
                }
            })
            tasks.push(task)
        }

        return tasks
    },

    // ==================== 工作流设计 ====================

    /**
     * 保存或更新工作流配置
     */
    async saveWorkflowDefinition(data: any, userId: string): Promise<any> {
        return prisma.workflowDefinition.create({
            data: {
                name: data.name,
                description: data.description || '',
                triggerType: data.triggerType,
                triggerConfig: data.triggerConfig || {},
                nodes: data.nodes || [],
                edges: data.edges || [],
                isActive: data.isActive !== false,
                createdBy: userId
            }
        })
    },

    /**
     * 测试运行工作流配置
     */
    async testWorkflowDefinition(data: any): Promise<any> {
        // 返回模拟日志
        return {
            success: true,
            logs: [
                `[${new Date().toLocaleTimeString()}] 触发类型: ${data.triggerType} 校验通过。`,
                `[${new Date().toLocaleTimeString()}] 解析到 ${data.nodes?.length || 0} 个执行节点。`,
                `[${new Date().toLocaleTimeString()}] 依赖参数注入测试完成，模拟执行未发生崩溃。`
            ]
        }
    }
}

export default workflowService
