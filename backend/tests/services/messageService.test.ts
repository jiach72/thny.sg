import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
    },
    message: {
        create: vi.fn(),
        createMany: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
    },
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { messageService } from '../../src/services/messageService.js'

describe('MessageService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('send', () => {
        it('应成功发送站内消息', async () => {
            prismaMock.user.findUnique.mockResolvedValue({ id: 'r1', name: 'Recipient' })
            const mockMessage = { id: '1', title: 'Hello', content: 'World' }
            prismaMock.message.create.mockResolvedValue(mockMessage)

            const result = await messageService.send({
                senderId: 's1',
                recipientId: 'r1',
                title: 'Hello',
                content: 'World',
            })

            expect(result).toEqual(mockMessage)
        })

        it('接收者不存在时应抛出 NotFoundError', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null)

            await expect(
                messageService.send({ senderId: 's1', recipientId: 'r1', title: 'T', content: 'C' })
            ).rejects.toThrow('接收者不存在')
        })
    })

    describe('sendBulk', () => {
        it('应批量发送消息', async () => {
            prismaMock.message.createMany.mockResolvedValue({ count: 3 })

            const result = await messageService.sendBulk('s1', ['r1', 'r2', 'r3'], 'Title', 'Content')

            expect(result.count).toBe(3)
        })
    })

    describe('getMessages', () => {
        it('应返回用户消息列表', async () => {
            const mockMessages = [{ id: '1', title: 'Hello' }]
            prismaMock.message.findMany.mockResolvedValue(mockMessages)
            prismaMock.message.count.mockResolvedValue(1)

            const result = await messageService.getMessages('u1')

            expect(result.messages).toEqual(mockMessages)
            expect(result.total).toBe(1)
        })

        it('应支持已读/未读筛选', async () => {
            prismaMock.message.findMany.mockResolvedValue([])
            prismaMock.message.count.mockResolvedValue(0)

            await messageService.getMessages('u1', { isRead: false, type: 'SYSTEM' }, 2, 10)

            expect(prismaMock.message.findMany).toHaveBeenCalled()
        })
    })

    describe('getById', () => {
        it('应返回消息详情并自动标记已读', async () => {
            const mockMessage = { id: '1', isRead: false, recipientId: 'u1' }
            prismaMock.message.findFirst.mockResolvedValue(mockMessage)
            prismaMock.message.update.mockResolvedValue({ ...mockMessage, isRead: true })

            const result = await messageService.getById('1', 'u1')

            expect(result.isRead).toBe(true)
            expect(prismaMock.message.update).toHaveBeenCalled()
        })

        it('消息不存在时应抛出 NotFoundError', async () => {
            prismaMock.message.findFirst.mockResolvedValue(null)

            await expect(messageService.getById('1', 'u1')).rejects.toThrow('消息不存在')
        })

        it('已读消息不应重复标记', async () => {
            const mockMessage = { id: '1', isRead: true, recipientId: 'u1' }
            prismaMock.message.findFirst.mockResolvedValue(mockMessage)

            const result = await messageService.getById('1', 'u1')

            expect(result.isRead).toBe(true)
            expect(prismaMock.message.update).not.toHaveBeenCalled()
        })
    })

    describe('markAsRead', () => {
        it('应标记消息为已读', async () => {
            prismaMock.message.findFirst.mockResolvedValue({ id: '1', isRead: false, recipientId: 'u1' })
            prismaMock.message.update.mockResolvedValue({ id: '1', isRead: true })

            const result = await messageService.markAsRead('1', 'u1')
            expect(result.success).toBe(true)
        })

        it('消息不存在时抛出 NotFoundError', async () => {
            prismaMock.message.findFirst.mockResolvedValue(null)

            await expect(messageService.markAsRead('1', 'u1')).rejects.toThrow('消息不存在')
        })

        it('已读消息应返回提示', async () => {
            prismaMock.message.findFirst.mockResolvedValue({ id: '1', isRead: true, recipientId: 'u1' })

            const result = await messageService.markAsRead('1', 'u1')
            expect(result.message).toBe('消息已是已读状态')
        })
    })

    describe('markAllAsRead', () => {
        it('应批量标记所有未读消息', async () => {
            prismaMock.message.updateMany.mockResolvedValue({ count: 5 })

            const result = await messageService.markAllAsRead('u1')
            expect(result.success).toBe(true)
            expect(result.count).toBe(5)
        })
    })

    describe('getUnreadCount', () => {
        it('应返回未读消息数', async () => {
            prismaMock.message.count.mockResolvedValue(3)

            const result = await messageService.getUnreadCount('u1')
            expect(result.count).toBe(3)
        })
    })

    describe('delete', () => {
        it('应成功删除消息', async () => {
            prismaMock.message.findFirst.mockResolvedValue({ id: '1', recipientId: 'u1' })
            prismaMock.message.delete.mockResolvedValue({ id: '1' })

            const result = await messageService.delete('1', 'u1')
            expect(result.success).toBe(true)
        })

        it('消息不存在时抛出 NotFoundError', async () => {
            prismaMock.message.findFirst.mockResolvedValue(null)

            await expect(messageService.delete('1', 'u1')).rejects.toThrow('消息不存在')
        })
    })

    describe('getSentMessages', () => {
        it('应返回已发送消息列表', async () => {
            const mockMessages = [{ id: '1', title: 'Sent' }]
            prismaMock.message.findMany.mockResolvedValue(mockMessages)
            prismaMock.message.count.mockResolvedValue(1)

            const result = await messageService.getSentMessages('s1', 1, 20)
            expect(result.messages).toEqual(mockMessages)
        })
    })

    describe('getCustomerUsers', () => {
        it('应返回活跃客户用户列表', async () => {
            const mockUsers = [{ id: '1', name: 'Customer' }]
            prismaMock.user.findMany.mockResolvedValue(mockUsers)

            const result = await messageService.getCustomerUsers()
            expect(result).toEqual(mockUsers)
        })
    })
})
