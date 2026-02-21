import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mock Dependencies ---
const mocks = vi.hoisted(() => {
    return {
        mockMessageService: { send: vi.fn() },
        mockEmailSenderService: { send: vi.fn() },
        mockEmailTemplateService: { sendWithTemplate: vi.fn() },
        mockNotifyUsers: vi.fn(),
        mockPrisma: {
            user: {
                findMany: vi.fn(),
                findFirst: vi.fn()
            }
        }
    }
})

vi.mock('../../src/services/messageService.js', () => ({ messageService: mocks.mockMessageService }))
vi.mock('../../src/services/emailSenderService.js', () => ({ emailSenderService: mocks.mockEmailSenderService }))
vi.mock('../../src/services/emailTemplateService.js', () => ({ emailTemplateService: mocks.mockEmailTemplateService }))
vi.mock('../../src/services/websocketService.js', () => ({
    notifyUser: vi.fn(),
    notifyUsers: mocks.mockNotifyUsers
}))
vi.mock('../../src/config/index.js', () => ({
    prisma: mocks.mockPrisma,
    config: { jwt: { secret: 'test' }, redisUrl: '' }
}))
vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() }
}))

import { notificationService } from '../../src/services/notificationService.js'

// --- Tests ---
describe('notificationService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('dispatch', () => {
        it('should dispatch to WEBSOCKET and IN_APP based on defaults', async () => {
            mocks.mockPrisma.user.findFirst.mockResolvedValueOnce({ id: 'system-1' })
            mocks.mockMessageService.send.mockResolvedValueOnce({ id: 'msg-1' })

            await notificationService.dispatch({
                event: 'LEAD_ASSIGNED',
                recipientIds: ['user-1'],
                title: 'Test',
                content: 'Test msg'
            })

            // WebSocket
            expect(mocks.mockNotifyUsers).toHaveBeenCalledWith(['user-1'], 'notification', expect.objectContaining({
                event: 'LEAD_ASSIGNED',
                title: 'Test',
                content: 'Test msg'
            }))

            // InApp
            expect(mocks.mockMessageService.send).toHaveBeenCalledWith({
                senderId: 'system-1',
                recipientId: 'user-1',
                title: 'Test',
                content: 'Test msg',
                type: 'SYSTEM'
            })

            // Email should NOT be called
            expect(mocks.mockEmailSenderService.send).not.toHaveBeenCalled()
        })

        it('should dispatch EMAIL with fallback to raw html when no template ID', async () => {
            mocks.mockPrisma.user.findMany.mockResolvedValueOnce([
                { id: 'user-1', email: 'test@tonghai.sg', name: 'User 1' }
            ])

            await notificationService.dispatch({
                event: 'TASK_DUE_SOON', // this has EMAIL in EVENT_CHANNEL_MAP defaults
                recipientIds: ['user-1'],
                channels: ['EMAIL'], // override explicit
                title: 'Task due',
                content: 'Do it now'
            })

            expect(mocks.mockPrisma.user.findMany).toHaveBeenCalledWith({
                where: { id: { in: ['user-1'] } },
                select: { id: true, email: true, name: true }
            })
            expect(mocks.mockEmailSenderService.send).toHaveBeenCalledWith({
                to: 'test@tonghai.sg',
                subject: 'Task due',
                html: '<p>Do it now</p>'
            })
            expect(mocks.mockEmailTemplateService.sendWithTemplate).not.toHaveBeenCalled()
        })
    })

    describe('便捷分发方法', () => {
        it('notifyLeadAssigned should pass correct payload to dispatch', async () => {
            const dispatchSpy = vi.spyOn(notificationService, 'dispatch').mockResolvedValueOnce()

            await notificationService.notifyLeadAssigned('lead-1', 'Lead Foo', 'assignee-1', 'assigner-1')

            expect(dispatchSpy).toHaveBeenCalledWith({
                event: 'LEAD_ASSIGNED',
                recipientIds: ['assignee-1'],
                actorId: 'assigner-1',
                title: '新线索分配',
                content: '您被分配了新线索「Lead Foo」，请及时跟进',
                entity: { type: 'LEAD', id: 'lead-1', name: 'Lead Foo' }
            })
        })
    })

    describe('Internal Tools', () => {
        it('getSystemUserId should return string if admin user found', async () => {
            mocks.mockPrisma.user.findFirst.mockResolvedValueOnce({ id: 'sys-admin-999' })
            const sid = await notificationService.getSystemUserId()
            expect(sid).toBe('sys-admin-999')
            expect(mocks.mockPrisma.user.findFirst).toHaveBeenCalledWith({
                where: { role: { code: 'ADMIN' } },
                select: { id: true }
            })
        })

        it('getSystemUserId should return null if not found', async () => {
            mocks.mockPrisma.user.findFirst.mockResolvedValueOnce(null)
            const sid = await notificationService.getSystemUserId()
            expect(sid).toBeNull()
        })
    })
})
