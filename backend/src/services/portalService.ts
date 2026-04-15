import { prisma } from '../config/index.js'
import bcrypt from 'bcryptjs'
import { NotFoundError, UnauthorizedError, BusinessLogicError } from '../middlewares/index.js'
import { familyMemberRepository } from '../repositories/FamilyMemberRepository.js'

interface UpdateProfileInput {
    name?: string
    phone?: string
    company?: string
    address?: string
}

interface ChangePasswordInput {
    currentPassword: string
    newPassword: string
}

export const portalService = {
    /**
     * 获取客户个人资料
     */
    async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                createdAt: true,
            },
        })

        if (!user) {
            throw new NotFoundError('用户不存在')
        }

        // 获取关联的客户信息
        const customer = await prisma.customer.findFirst({
            where: { userId },
            select: {
                id: true,
                companyName: true,
                phone: true,
                contactName: true,
                riskGrade: true,
            },
        })

        const familyMembers = customer
            ? await familyMemberRepository.findByCustomerId(customer.id)
            : []

        return {
            ...user,
            phone: customer?.phone || null,
            company: customer?.companyName || null,
            customerId: customer?.id || null,
            familyMembers,
            riskGrade: customer?.riskGrade || 'LOW',
        }
    },

    /**
     * 更新客户个人资料
     */
    async updateProfile(userId: string, data: UpdateProfileInput) {
        // 使用事务保证用户信息与客户信息的原子性更新
        const user = await prisma.$transaction(async (tx) => {
            // 更新用户基本信息
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    name: data.name,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            })

            // 更新客户扩展信息
            const customer = await tx.customer.findFirst({
                where: { userId },
            })

            if (customer) {
                await tx.customer.update({
                    where: { id: customer.id },
                    data: {
                        phone: data.phone,
                        companyName: data.company,
                    },
                })
            }

            return updatedUser
        })

        return {
            success: true,
            message: '资料更新成功',
            user,
        }
    },

    /**
     * 修改密码
     * 修改成功后返回标记，由路由层负责清除 Cookie 使现有会话失效
     */
    async changePassword(userId: string, data: ChangePasswordInput) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!user) {
            throw new NotFoundError('用户不存在')
        }

        // 验证当前密码
        const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash)
        if (!isValid) {
            throw new UnauthorizedError('当前密码错误')
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
        if (!passwordRegex.test(data.newPassword)) {
            throw new BusinessLogicError('新密码必须包含大小写字母和数字')
        }

        // 更新密码
        const newPasswordHash = await bcrypt.hash(data.newPassword, 12)
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
        })

        return {
            success: true,
            message: '密码修改成功，请重新登录',
            requireRelogin: true, // 标记前端需要重新登录
        }
    },

    /**
     * 获取客户的项目列表
     */
    async getMyProjects(userId: string) {
        const customer = await prisma.customer.findFirst({
            where: { userId },
            include: {
                projects: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        documents: {
                            where: { deletedAt: null },
                            take: 5,
                            orderBy: { createdAt: 'desc' },
                        },
                    },
                },
            },
        })

        if (!customer) {
            return []
        }

        return customer.projects
    },

    /**
     * 获取客户的项目详情
     */
    async getProjectDetail(userId: string, projectId: string) {
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                customer: { userId }
            },
            include: {
                customer: {
                    include: {
                        lead: {
                            include: {
                                assignedTo: {
                                    select: { id: true, name: true, email: true, avatarUrl: true }
                                }
                            }
                        }
                    }
                },
                tasks: {
                    orderBy: { dueDate: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                        dueDate: true,
                        description: true
                    }
                },
                documents: {
                    where: {
                        accessLevel: { in: ['PUBLIC', 'TEAM'] },
                        deletedAt: null
                    },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        uploadedBy: { select: { name: true } }
                    }
                }
            }
        })

        if (!project) {
            throw new NotFoundError('项目不存在或无权访问')
        }

        // 扁平化顾问信息
        const consultant = project.customer?.lead?.assignedTo || null

        // 移除敏感关联信息并返回
        const { customer: _customer, ...rest } = project
        return {
            ...rest,
            consultant
        }
    },

    /**
     * 获取客户的待办事项/通知
     */
    async getNotifications(userId: string) {
        const customer = await prisma.customer.findFirst({
            where: { userId },
        })

        if (!customer) {
            return []
        }

        // 获取需要客户操作的任务（如待签署文档等）
        const pendingDocuments = await prisma.document.findMany({
            where: {
                project: { customerId: customer.id },
                accessLevel: 'TEAM', // 需要客户查看的
                deletedAt: null
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fileName: true,
                createdAt: true,
                project: {
                    select: { id: true, title: true },
                },
            },
        })

        // 获取待支付账单
        const pendingInvoices = await prisma.invoice.findMany({
            where: {
                customerId: customer.id,
                status: 'PENDING',
                deletedAt: null
            },
            take: 10,
            orderBy: { dueDate: 'asc' },
            select: {
                id: true,
                invoiceNumber: true,
                totalAmount: true,
                currency: true,
                dueDate: true,
                project: {
                    select: { title: true, id: true },
                },
            },
        })

        // 转换为通知格式
        const docNotifications = pendingDocuments.map((doc) => ({
            id: doc.id,
            type: 'document',
            title: '新文档待查看',
            description: `${(doc.project?.title || 'Unknown')} - ${doc.fileName}`,
            createdAt: doc.createdAt,
            projectId: doc.project?.id
        }))

        const invoiceNotifications = pendingInvoices.map((inv) => ({
            id: inv.id,
            type: 'invoice',
            title: '待支付账单',
            description: `${(inv.project?.title || 'Unknown')} - #${inv.invoiceNumber} (${Number(inv.totalAmount).toLocaleString()} ${inv.currency})`,
            createdAt: inv.dueDate,
            projectId: inv.project?.id
        }))

        return [...docNotifications, ...invoiceNotifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    /**
     * 获取仪表板统计数据
     */
    async getDashboardStats(userId: string) {
        const customer = await prisma.customer.findFirst({
            where: { userId },
            include: {
                projects: true,
                lead: {
                    include: {
                        assignedTo: {
                            select: { id: true, name: true, email: true, avatarUrl: true, department: true }
                        }
                    }
                }
            },
        })

        if (!customer) {
            return {
                totalProjects: 0,
                activeProjects: 0,
                completedProjects: 0,
                pendingDocuments: 0,
            }
        }

        const activeProjects = customer.projects.filter(
            (p) => p.status === 'ACTIVE' || p.status === 'PLANNING'
        ).length
        const completedProjects = customer.projects.filter(
            (p) => p.status === 'COMPLETED'
        ).length

        const pendingDocuments = await prisma.document.count({
            where: {
                project: { customerId: customer.id },
                accessLevel: 'TEAM',
                deletedAt: null
            },
        })

        // 抽取客户所有活跃项目相关的重大关键任务(Milestones)用作时间线展示
        const upcomingMilestones = await prisma.task.findMany({
            where: {
                projectId: { in: customer.projects.map(p => p.id) },
                status: { not: 'DONE' },
                dueDate: { not: null }
            },
            take: 5,
            orderBy: { dueDate: 'asc' },
            select: {
                id: true,
                title: true,
                dueDate: true,
                status: true,
                project: {
                    select: { id: true, title: true }
                }
            }
        })

        const consultantUser = customer.lead?.assignedTo;
        const consultant = consultantUser ? {
            id: consultantUser.id,
            name: consultantUser.name,
            email: consultantUser.email,
            avatarUrl: consultantUser.avatarUrl || undefined,
            title: consultantUser.department || '高级顾问'
        } : undefined;

        return {
            totalProjects: customer.projects.length,
            activeProjects,
            completedProjects,
            pendingDocuments,
            upcomingMilestones,
            consultant,
        }
    },

    // ==================== 服务咨询及预约 ====================

    /**
     * 客户自助预约面谈
     */
    async bookAppointment(customerIdOrUserId: string, data: {
        title: string
        description?: string
        startTime: string
        endTime: string
        userId: string // 预约目标（通常为专属顾问）
        projectId?: string
    }) {
        const _customer = await prisma.customer.findFirst({
            where: { userId: customerIdOrUserId },
        })

        if (!_customer) {
            throw new NotFoundError('客户资料不全，无法发起预订')
        }

        const start = new Date(data.startTime)
        const end = new Date(data.endTime)
        const now = new Date()

        if (start < now || end <= start) {
            throw new BusinessLogicError('预约时间无效（不能预约过去的时间或时段错误）')
        }

        // 复用后端的日程防冲突逻辑
        const { appointmentService } = await import('./appointmentService.js')
        await appointmentService.checkConflict(data.userId, start, end)

        // 插入记录
        const newAppt = await prisma.appointment.create({
            data: {
                title: data.title,
                description: data.description || '自助门户预约',
                startTime: start,
                endTime: end,
                type: 'MEETING',
                status: 'SCHEDULED',
                userId: data.userId, // 绑定到指定顾问
                customerId: _customer.id,
            }
        })

        return {
            success: true,
            message: '预约成功',
            appointment: newAppt
        }
    },

    /**
     * 创建服务咨询
     */
    async createInquiry(userId: string, data: {
        serviceType: string
        name?: string
        phone?: string
        email?: string
        message: string
        preferredContact?: string
    }) {
        const _customer = await prisma.customer.findFirst({
            where: { userId },
        })

        // 创建 Lead 作为咨询记录
        const lead = await prisma.lead.create({
            data: {
                contactName: data.name || 'Customer Inquiry',
                email: data.email || '',
                phone: data.phone || '',
                sourceChannel: 'PORTAL',
                status: 'NEW',
                inquiryMessage: `[服务类型] ${data.serviceType}\n[偏好联系方式] ${data.preferredContact || 'phone'}\n\n${data.message}`,
            },
        })

        return {
            success: true,
            message: '咨询已提交',
            inquiryId: lead.id,
        }
    },

    // ==================== 家庭成员管理 ====================

    /**
     * 添加家庭成员
     */
    async addFamilyMember(userId: string, data: {
        name: string
        relationship: string
        isBeneficiary?: boolean
    }) {
        const customer = await prisma.customer.findFirst({
            where: { userId },
        })

        if (!customer) {
            throw new NotFoundError('客户信息不存在')
        }

        const member = await familyMemberRepository.create({
            customer: { connect: { id: customer.id } },
            name: data.name,
            relationship: data.relationship,
            isBeneficiary: data.isBeneficiary || false,
        })

        return {
            success: true,
            message: '成员已添加',
            member,
        }
    },

    /**
     * 更新家庭成员
     */
    async updateFamilyMember(userId: string, memberId: string, data: {
        name?: string
        relationship?: string
        isBeneficiary?: boolean
    }) {
        const customer = await prisma.customer.findFirst({
            where: { userId },
        })

        if (!customer) {
            throw new NotFoundError('客户信息不存在')
        }

        const existingMember = await familyMemberRepository.findByCustomerAndMemberId(
            customer.id,
            memberId
        )

        if (!existingMember) {
            throw new NotFoundError('成员不存在')
        }

        const member = await familyMemberRepository.update(memberId, data)

        return {
            success: true,
            message: '成员已更新',
            member,
        }
    },

    /**
     * 删除家庭成员
     */
    async deleteFamilyMember(userId: string, memberId: string) {
        const customer = await prisma.customer.findFirst({
            where: { userId },
        })

        if (!customer) {
            throw new NotFoundError('客户信息不存在')
        }

        const existingMember = await familyMemberRepository.findByCustomerAndMemberId(
            customer.id,
            memberId
        )

        if (!existingMember) {
            throw new NotFoundError('成员不存在')
        }

        await familyMemberRepository.softDelete(memberId)

        return {
            success: true,
            message: '成员已删除',
        }
    },

    /**
     * 获取家庭成员列表
     */
    async getFamilyMembers(userId: string) {
        const customer = await prisma.customer.findFirst({
            where: { userId },
        })

        if (!customer) {
            throw new NotFoundError('客户信息不存在')
        }

        const members = await familyMemberRepository.findByCustomerId(customer.id)

        return {
            success: true,
            members,
        }
    },

    // ==================== 通知偏好 ====================

    /**
     * 更新通知偏好
     */
    async updatePreferences(userId: string, preferences: {
        email?: boolean
        sms?: boolean
        projectUpdate?: boolean
        documentReminder?: boolean
    }) {
        const customer = await prisma.customer.findFirst({
            where: { userId },
        })

        if (!customer) {
            throw new NotFoundError('客户信息不存在')
        }

        // 将通知偏好序列化后存入 profileNotes 的 JSON 段落
        // TODO: 后续迭代应在 Customer 模型中增加独立的 preferences Json? 字段
        const existingNotes = customer.profileNotes || ''
        const prefMarker = '<!-- PREFERENCES -->'
        const prefJson = JSON.stringify(preferences)
        const prefBlock = `${prefMarker}\n${prefJson}\n${prefMarker}`

        // 替换已有的 preferences 块或追加
        let updatedNotes: string
        if (existingNotes.includes(prefMarker)) {
            const regex = new RegExp(`${prefMarker}[\\s\\S]*?${prefMarker}`)
            updatedNotes = existingNotes.replace(regex, prefBlock)
        } else {
            updatedNotes = existingNotes ? `${existingNotes}\n\n${prefBlock}` : prefBlock
        }

        await prisma.customer.update({
            where: { id: customer.id },
            data: {
                profileNotes: updatedNotes,
            },
        })

        return {
            success: true,
            message: '偏好已保存',
            preferences,
        }
    },

    // ==================== 账单发票 (从路由层提取) ====================

    /**
     * 获取客户的发票列表
     */
    async getInvoices(userId: string, options: { page?: number; limit?: number; status?: string }) {
        const page = options.page || 1
        const limit = options.limit || 20

        const profile = await this.getProfile(userId)
        if (!profile.customerId) {
            return { invoices: [], total: 0, page, limit, totalPages: 0 }
        }

        const where: { customerId: string; deletedAt: null; status?: string } = {
            customerId: profile.customerId,
            deletedAt: null,
        }
        if (options.status) {
            where.status = options.status
        }

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                orderBy: { issueDate: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    project: { select: { id: true, title: true } },
                },
            }),
            prisma.invoice.count({ where }),
        ])

        return { invoices, total, page, limit, totalPages: Math.ceil(total / limit) }
    },

    /**
     * 获取指定发票详情及付款记录
     */
    async getInvoiceById(userId: string, invoiceId: string) {
        const profile = await this.getProfile(userId)
        if (!profile.customerId) throw new NotFoundError('用户非客户')

        const invoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                customerId: profile.customerId,
                deletedAt: null,
            },
            include: {
                project: { select: { id: true, title: true } },
                payments: { orderBy: { paymentDate: 'desc' } },
            },
        })

        if (!invoice) throw new NotFoundError('账单未找到')
        return invoice
    },

    // ==================== 文档档案 (从路由层提取) ====================

    /**
     * 获取客户可见的文档列表
     */
    async getDocuments(userId: string, options: { page?: number; limit?: number }) {
        const page = options.page || 1
        const limit = options.limit || 20

        const profile = await this.getProfile(userId)
        if (!profile.customerId) {
            return { documents: [], total: 0, page, limit, totalPages: 0 }
        }

        const where = {
            project: { customerId: profile.customerId },
            accessLevel: { in: ['TEAM' as const, 'PUBLIC' as const] },
            deletedAt: null,
        }

        const [documents, total] = await Promise.all([
            prisma.document.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    project: { select: { id: true, title: true } },
                    signatureRequests: {
                        where: { status: 'PENDING' },
                        select: { id: true, status: true, title: true },
                    },
                },
            }),
            prisma.document.count({ where }),
        ])

        return { documents, total, page, limit, totalPages: Math.ceil(total / limit) }
    },

    /**
     * 签署文档
     */
    async signDocument(userId: string, documentId: string, signatureData: string) {
        const profile = await this.getProfile(userId)
        if (!profile.customerId) throw new NotFoundError('仅正式客户可签署文档')

        const pendingReq = await prisma.signatureRequest.findFirst({
            where: {
                documentId,
                project: { customerId: profile.customerId },
                status: 'PENDING',
            },
        })

        if (!pendingReq) throw new NotFoundError('没有需要该客户签署的申请')

        const updated = await prisma.signatureRequest.update({
            where: { id: pendingReq.id },
            data: {
                status: 'SIGNED',
                signedAt: new Date(),
                signatureUrl: signatureData,
            },
        })

        return { success: true, request: updated }
    },

    // ==================== FAQ 知识库 (从路由层提取) ====================

    /**
     * 获取 FAQ 分类及其条目
     */
    async getFaqs() {
        return prisma.faqCategory.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
                items: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        question: true,
                        questionEn: true,
                        answer: true,
                        answerEn: true,
                        viewCount: true,
                    },
                },
            },
        })
    },

    /**
     * 标记 FAQ 条目为有帮助
     */
    async markFaqHelpful(faqId: string): Promise<{ success: boolean }> {
        try {
            await prisma.faqItem.update({
                where: { id: faqId },
                data: { helpfulCount: { increment: 1 } },
            })
            return { success: true }
        } catch {
            return { success: false }
        }
    },

    // ==================== 账户注销与数据擦除 ====================

    /**
     * 删除账户并匿名化个人数据（GDPR 数据擦除合规）
     * 在事务中依次软删除关联数据，并对用户/客户的个人标识信息进行匿名化处理
     */
    async deleteAccount(userId: string) {
        return await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } })
            if (!user) throw new NotFoundError('用户不存在')

            if (user.status === 'INACTIVE') {
                throw new BusinessLogicError('账户已注销')
            }

            const customer = await tx.customer.findUnique({ where: { userId } })

            if (customer) {
                // 1. 软删除家庭成员
                await tx.familyMember.updateMany({
                    where: { customerId: customer.id, deletedAt: null },
                    data: { deletedAt: new Date() }
                })

                // 2. 软删除客户项目下的文档
                const customerProjects = await tx.project.findMany({
                    where: { customerId: customer.id },
                    select: { id: true }
                })
                const projectIds = customerProjects.map(p => p.id)

                if (projectIds.length > 0) {
                    await tx.document.updateMany({
                        where: { projectId: { in: projectIds } },
                        data: { deletedAt: new Date() }
                    })
                }

                // 3. 软删除项目
                await tx.project.updateMany({
                    where: { customerId: customer.id },
                    data: { deletedAt: new Date() }
                })

                // 4. 匿名化客户个人标识信息并软删除
                await tx.customer.update({
                    where: { id: customer.id },
                    data: {
                        contactName: '已删除用户',
                        companyName: null,
                        email: `deleted_${customer.id}@redacted.com`,
                        phone: null,
                        profileNotes: null,
                        deletedAt: new Date(),
                    }
                })
            }

            // 5. 匿名化用户个人标识信息
            await tx.user.update({
                where: { id: userId },
                data: {
                    name: '已删除用户',
                    email: `deleted_${userId}@redacted.com`,
                    avatarUrl: null,
                    twoFactorSecret: null,
                    twoFactorEnabled: false,
                    status: 'INACTIVE',
                }
            })

            // 6. 解除该用户作为顾问的 Lead 分配关系
            await tx.lead.updateMany({
                where: { assignedToId: userId },
                data: { assignedToId: null }
            })

            return { success: true, message: '账户已删除，个人数据已匿名化' }
        })
    },
}

export default portalService
