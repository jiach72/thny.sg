import { prisma } from '../config'
import { NotFoundError } from '../middlewares'

interface SendMessageInput {
    senderId: string
    recipientId: string
    title: string
    content: string
    type?: 'SYSTEM' | 'PROJECT' | 'DOCUMENT' | 'PAYMENT' | 'REMINDER' | 'ANNOUNCEMENT'
    projectId?: string
}

interface MessageFilters {
    isRead?: boolean
    type?: string
}

export const messageService = {
    /**
     * 发送站内消息
     */
    async send(input: SendMessageInput) {
        const { senderId, recipientId, title, content, type = 'SYSTEM', projectId } = input

        // 验证接收者存在
        const recipient = await prisma.user.findUnique({ where: { id: recipientId } })
        if (!recipient) {
            throw new NotFoundError('接收者不存在')
        }

        const message = await prisma.message.create({
            data: {
                senderId,
                recipientId,
                title,
                content,
                type,
                projectId,
            },
            include: {
                sender: { select: { id: true, name: true, email: true, avatarUrl: true } },
                recipient: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, title: true } },
            },
        })

        return message
    },

    /**
     * 批量发送消息给多个客户
     */
    async sendBulk(senderId: string, recipientIds: string[], title: string, content: string, type = 'ANNOUNCEMENT' as const) {
        const messages = await prisma.message.createMany({
            data: recipientIds.map((recipientId) => ({
                senderId,
                recipientId,
                title,
                content,
                type,
            })),
        })

        return { count: messages.count }
    },

    /**
     * 获取用户的消息列表
     */
    async getMessages(userId: string, filters: MessageFilters = {}, page = 1, limit = 20) {
        const where: any = { recipientId: userId }

        if (filters.isRead !== undefined) {
            where.isRead = filters.isRead
        }
        if (filters.type) {
            where.type = filters.type
        }

        const [messages, total] = await Promise.all([
            prisma.message.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    sender: { select: { id: true, name: true, avatarUrl: true } },
                    project: { select: { id: true, title: true } },
                },
            }),
            prisma.message.count({ where }),
        ])

        return { messages, total, page, limit, totalPages: Math.ceil(total / limit) }
    },

    /**
     * 获取单条消息详情
     */
    async getById(messageId: string, userId: string) {
        const message = await prisma.message.findFirst({
            where: { id: messageId, recipientId: userId },
            include: {
                sender: { select: { id: true, name: true, avatarUrl: true, email: true } },
                project: { select: { id: true, title: true } },
            },
        })

        if (!message) {
            throw new NotFoundError('消息不存在')
        }

        // 自动标记为已读
        if (!message.isRead) {
            await prisma.message.update({
                where: { id: messageId },
                data: { isRead: true, readAt: new Date() },
            })
        }

        return { ...message, isRead: true }
    },

    /**
     * 标记消息为已读
     */
    async markAsRead(messageId: string, userId: string) {
        const message = await prisma.message.findFirst({
            where: { id: messageId, recipientId: userId },
        })

        if (!message) {
            throw new NotFoundError('消息不存在')
        }

        if (message.isRead) {
            return { success: true, message: '消息已是已读状态' }
        }

        await prisma.message.update({
            where: { id: messageId },
            data: { isRead: true, readAt: new Date() },
        })

        return { success: true }
    },

    /**
     * 批量标记为已读
     */
    async markAllAsRead(userId: string) {
        const result = await prisma.message.updateMany({
            where: { recipientId: userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        })

        return { success: true, count: result.count }
    },

    /**
     * 获取未读消息数量
     */
    async getUnreadCount(userId: string) {
        const count = await prisma.message.count({
            where: { recipientId: userId, isRead: false },
        })

        return { unreadCount: count }
    },

    /**
     * 删除消息（软删除或真删除可选）
     */
    async delete(messageId: string, userId: string) {
        const message = await prisma.message.findFirst({
            where: { id: messageId, recipientId: userId },
        })

        if (!message) {
            throw new NotFoundError('消息不存在')
        }

        await prisma.message.delete({ where: { id: messageId } })

        return { success: true }
    },

    /**
     * 管理端：获取所有已发送的消息
     */
    async getSentMessages(senderId: string, page = 1, limit = 20) {
        const [messages, total] = await Promise.all([
            prisma.message.findMany({
                where: { senderId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    recipient: { select: { id: true, name: true, email: true } },
                    project: { select: { id: true, title: true } },
                },
            }),
            prisma.message.count({ where: { senderId } }),
        ])

        return { messages, total, page, limit }
    },

    /**
     * 管理端：获取所有客户用户（用于发送消息选择）
     */
    async getCustomerUsers() {
        const customers = await prisma.user.findMany({
            where: { role: { code: 'CUSTOMER' }, status: 'ACTIVE' },
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' },
        })

        return customers
    },
}

export default messageService
