import { prisma } from '../config/index.js'
import bcrypt from 'bcryptjs'
import { NotFoundError, UnauthorizedError } from '../middlewares/index.js'

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
            },
        })

        return {
            ...user,
            phone: customer?.phone || null,
            company: customer?.companyName || null,
            customerId: customer?.id || null,
        }
    },

    /**
     * 更新客户个人资料
     */
    async updateProfile(userId: string, data: UpdateProfileInput) {
        // 更新用户基本信息
        const user = await prisma.user.update({
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
        const customer = await prisma.customer.findFirst({
            where: { userId },
        })

        if (customer) {
            await prisma.customer.update({
                where: { id: customer.id },
                data: {
                    phone: data.phone,
                    companyName: data.company,
                },
            })
        }

        return {
            success: true,
            message: '资料更新成功',
            user,
        }
    },

    /**
     * 修改密码
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

        // 更新密码
        const newPasswordHash = await bcrypt.hash(data.newPassword, 12)
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
        })

        return {
            success: true,
            message: '密码修改成功',
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
                        accessLevel: { in: ['PUBLIC', 'TEAM'] }
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
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fileName: true,
                createdAt: true,
                project: {
                    select: { title: true },
                },
            },
        })

        // 转换为通知格式
        return pendingDocuments.map((doc) => ({
            id: doc.id,
            type: 'document',
            title: '新文档待查看',
            description: `${(doc.project?.title || 'Unknown')} - ${doc.fileName}`,
            createdAt: doc.createdAt,
        }))
    },

    /**
     * 获取仪表板统计数据
     */
    async getDashboardStats(userId: string) {
        const customer = await prisma.customer.findFirst({
            where: { userId },
            include: {
                projects: true,
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
            },
        })

        return {
            totalProjects: customer.projects.length,
            activeProjects,
            completedProjects,
            pendingDocuments,
        }
    },
}

export default portalService
