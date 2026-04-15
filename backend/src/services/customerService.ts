import { prisma } from '../config/index.js'
import { webhookService } from './webhookService.js'
import logger from '../config/logger.js'

interface CustomerListParams {
    page?: number
    limit?: number
    search?: string
    kycStatus?: string
    riskGrade?: string
    sourceChannel?: string
    assignedToId?: string
    tags?: string[]
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export const customerService = {
    /**
     * 获取客户列表（分页 + 搜索 + 筛选）
     */
    async getCustomerList(params: CustomerListParams) {
        const {
            page = 1,
            limit = 20,
            search,
            kycStatus,
            riskGrade,
            sourceChannel,
            assignedToId,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = params

        const where: Record<string, unknown> = { deletedAt: null }

        if (search) {
            where.OR = [
                { contactName: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { lead: { contactName: { contains: search, mode: 'insensitive' } } },
                { lead: { companyName: { contains: search, mode: 'insensitive' } } },
            ]
        }

        if (kycStatus) where.kycStatus = kycStatus
        if (riskGrade) where.riskGrade = riskGrade
        if (sourceChannel) where.lead = { ...(where.lead as object), sourceChannel }
        if (assignedToId) where.lead = { ...(where.lead as object), assignedToId }
        if (params.tags && params.tags.length > 0) {
            // Prisma 支持 PostgreSQL string array hasSome
            where.tags = { hasSome: Array.isArray(params.tags) ? params.tags : [params.tags] }
        }

        // 构建排序
        const orderBy: Record<string, string> = {}
        if (sortBy === 'contactName') orderBy.contactName = sortOrder
        else if (sortBy === 'riskGrade') orderBy.riskGrade = sortOrder
        else orderBy.createdAt = sortOrder

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where: where as never,
                include: {
                    lead: {
                        select: {
                            contactName: true,
                            companyName: true,
                            email: true,
                            phone: true,
                            sourceChannel: true,
                            tags: true,
                            assignedTo: { select: { id: true, name: true, avatarUrl: true } },
                        },
                    },
                    user: { select: { id: true, name: true, email: true, status: true } },
                    projects: {
                        where: { deletedAt: null },
                        select: { id: true, status: true },
                    },
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.customer.count({ where: where as never }),
        ])

        return {
            data: customers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    },

    /**
     * 获取客户统计数据
     */
    async getStats() {
        const [
            totalCustomers,
            kycApproved,
            kycPending,
            highRisk,
            newThisMonth,
            activeProjectCustomers,
        ] = await Promise.all([
            prisma.customer.count({ where: { deletedAt: null } }),
            prisma.customer.count({ where: { deletedAt: null, kycStatus: 'APPROVED' } }),
            prisma.customer.count({ where: { deletedAt: null, kycStatus: 'PENDING' } }),
            prisma.customer.count({
                where: { deletedAt: null, riskGrade: { in: ['HIGH', 'CRITICAL'] } },
            }),
            prisma.customer.count({
                where: {
                    deletedAt: null,
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            }),
            prisma.customer.count({
                where: {
                    deletedAt: null,
                    projects: { some: { status: 'ACTIVE', deletedAt: null } },
                },
            }),
        ])

        return {
            totalCustomers,
            newThisMonth,
            kycApproved,
            kycPending,
            highRisk,
            activeProjectCustomers,
        }
    },

    /**
     * 获取客户完整详情
     */
    async getCustomerById(id: string) {
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                lead: {
                    include: {
                        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true, department: true } },
                        activities: {
                            take: 5,
                            orderBy: { createdAt: 'desc' },
                            include: { actor: { select: { name: true } } },
                        },
                    },
                },
                user: { select: { id: true, name: true, email: true, status: true, twoFactorEnabled: true } },
                projects: {
                    where: { deletedAt: null },
                    include: {
                        tasks: { where: { deletedAt: null }, select: { id: true, status: true } },
                        invoices: {
                            where: { deletedAt: null },
                            select: { id: true, totalAmount: true, paidAmount: true, status: true, dueDate: true },
                        },
                        documents: {
                            where: { deletedAt: null },
                            select: { id: true, fileName: true, fileType: true, fileSize: true, accessLevel: true, createdAt: true }
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                appointments: {
                    orderBy: { startTime: 'desc' },
                    take: 20,
                    include: { user: { select: { name: true } } },
                },
            },
        })

        return customer
    },

    /**
     * 更新客户画像信息
     */
    async updateCustomer(id: string, data: Record<string, unknown>) {
        // 允许更新的字段白名单
        const allowedFields = [
            'contactName', 'companyName', 'email', 'phone',
            'birthday', 'occupation', 'interests', 'profileNotes',
            'companyInfo',
        ]

        const updateData: Record<string, unknown> = {}
        for (const key of allowedFields) {
            if (data[key] !== undefined) {
                updateData[key] = data[key]
            }
        }

        // 处理 birthday 日期转换
        if (updateData.birthday && typeof updateData.birthday === 'string') {
            updateData.birthday = new Date(updateData.birthday as string)
        }

        return prisma.customer.update({
            where: { id },
            data: updateData,
            include: {
                lead: { select: { contactName: true, companyName: true, email: true, phone: true } },
            },
        })
    },

    /**
     * 更新 KYC 状态
     */
    async updateKycStatus(id: string, kycStatus: string, riskGrade?: string) {
        const data: Record<string, unknown> = { kycStatus }
        if (riskGrade) data.riskGrade = riskGrade

        const result = await prisma.customer.update({
            where: { id },
            data,
        })

        if (kycStatus === 'APPROVED' || kycStatus === 'REJECTED') {
            webhookService.emit('customer.updated', result).catch(err => logger.error('Webhook推送失败', err))
        }

        return result
    },

    /**
     * 批量更新 KYC 状态
     */
    async batchUpdateKycStatus(ids: string[], kycStatus: string, riskGrade?: string) {
        const data: Record<string, unknown> = { kycStatus }
        if (riskGrade) data.riskGrade = riskGrade

        const result = await prisma.customer.updateMany({
            where: { id: { in: ids } },
            data,
        })

        if (kycStatus === 'APPROVED' || kycStatus === 'REJECTED') {
            // Retrieve updated customers to send in webhook (simplified for batch)
            const updatedCustomers = await prisma.customer.findMany({ where: { id: { in: ids } } })
            updatedCustomers.forEach(customer => {
                webhookService.emit('customer.updated', customer).catch(err => logger.error('Webhook推送失败', err))
            })
        }

        return result
    },

    /**
     * 获取客户互动时间线
     */
    async getTimeline(customerId: string) {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: { leadId: true },
        })

        if (!customer) return []

        // 合并多种活动
        const [activities, appointments] = await Promise.all([
            prisma.activity.findMany({
                where: { leadId: customer.leadId },
                include: { actor: { select: { name: true, avatarUrl: true } } },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            prisma.appointment.findMany({
                where: { customerId },
                include: { user: { select: { name: true } } },
                orderBy: { startTime: 'desc' },
                take: 30,
            }),
        ])

        // 合并并排序
        const timeline = [
            ...activities.map(a => ({
                id: a.id,
                type: 'activity' as const,
                title: a.description || a.actionType,
                actor: a.actor.name,
                date: a.createdAt,
                meta: { actionType: a.actionType, entityType: a.entityType, changes: a.changes },
            })),
            ...appointments.map(a => ({
                id: a.id,
                type: 'appointment' as const,
                title: a.title,
                actor: a.user.name,
                date: a.startTime,
                meta: { status: a.status, location: a.location, endTime: a.endTime, appointmentType: a.type },
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        return timeline
    },

    /**
     * 获取客户选项列表（下拉选择用）
     */
    async getConnectList(search?: string) {
        return prisma.customer.findMany({
            where: search ? {
                OR: [
                    { lead: { contactName: { contains: search, mode: 'insensitive' } } },
                    { lead: { companyName: { contains: search, mode: 'insensitive' } } },
                ],
            } : undefined,
            select: {
                id: true,
                lead: { select: { contactName: true, companyName: true, email: true } },
                companyInfo: true,
            },
            take: 50,
        })
    },

    /**
     * 自动评估并分类客户标签 (自动化分群)
     * 基于消费总额、服务类型等
     */
    async autoAssignTags(customerId: string) {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                lead: { select: { serviceTypes: true, sourceChannel: true } },
                projects: {
                    where: { deletedAt: null },
                    include: {
                        invoices: {
                            where: { deletedAt: null, status: { in: ['PAID', 'PARTIAL'] } },
                            select: { paidAmount: true }
                        }
                    }
                }
            }
        })

        if (!customer) return []

        const newTags = new Set<string>()

        // 1. 基于总消费打标
        let totalSpent = 0
        customer.projects.forEach(p => {
            p.invoices.forEach(inv => {
                totalSpent += Number(inv.paidAmount || 0)
            })
        })

        // 定义价值阶梯
        if (totalSpent >= 50000) newTags.add('VIP客户')
        else if (totalSpent >= 10000) newTags.add('高价值客户')
        else if (totalSpent > 0) newTags.add('已成交客户')
        else newTags.add('新客(未消费)')

        // 2. 基于服务类型打标
        const serviceMap: Record<string, string> = {
            'company_registration': '公司注册',
            'secretary_service': '公司秘书',
            'accounting': '财税服务',
            'work_permit': '工作准证',
            'family_office': '家族办公室',
            'vcc_fund': 'VCC基金'
        }

        customer.projects.forEach(p => {
            if (serviceMap[p.projectType]) newTags.add(`已购:${serviceMap[p.projectType]}`)
        })
        customer.lead.serviceTypes.forEach(t => {
            if (serviceMap[t]) newTags.add(`意向:${serviceMap[t]}`)
        })

        // 3. 来源打标
        if (customer.lead.sourceChannel) {
            newTags.add(`来源:${customer.lead.sourceChannel}`)
        }

        const tagsArray = Array.from(newTags)

        // 保留原有的非自动生成的标签 (可选, 目前完全覆盖并重算核心业务标签)
        // const existingTags = new Set(customer.tags || [])
        // tagsArray.forEach(t => existingTags.add(t))

        await prisma.customer.update({
            where: { id: customerId },
            data: { tags: tagsArray }
        })

        return tagsArray
    },
}
