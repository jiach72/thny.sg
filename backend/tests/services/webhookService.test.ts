import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    webhookEndpoint: {
        create: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    webhookLog: {
        create: vi.fn(),
    },
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

vi.mock('../../src/config/ssrfProtection.js', () => ({
    validateSafeUrl: vi.fn().mockResolvedValue(true),
}))

import { webhookService } from '../../src/services/webhookService'

describe('WebhookService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('registerEndpoint', () => {
        it('should register a new webhook endpoint', async () => {
            const mockEndpoint = {
                id: 'ep-1',
                url: 'https://example.com/webhook',
                events: ['lead.created'],
                secret: expect.any(String),
                name: '测试端点',
                isActive: true,
                createdById: 'user-1',
            }
            prismaMock.webhookEndpoint.create.mockResolvedValue(mockEndpoint)

            const result = await webhookService.registerEndpoint({
                url: 'https://example.com/webhook',
                events: ['lead.created'],
                name: '测试端点',
                createdById: 'user-1',
            })

            expect(result.id).toBe('ep-1')
            expect(prismaMock.webhookEndpoint.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        url: 'https://example.com/webhook',
                        events: ['lead.created'],
                        isActive: true,
                    }),
                })
            )
        })
    })

    describe('listEndpoints', () => {
        it('should list all endpoints with masked secrets', async () => {
            prismaMock.webhookEndpoint.findMany.mockResolvedValue([
                {
                    id: 'ep-1',
                    url: 'https://example.com/webhook',
                    events: ['lead.created'],
                    secret: 'abcdef1234567890abcdef1234567890',
                    name: '测试端点',
                    isActive: true,
                    createdBy: { id: 'user-1', name: '管理员' },
                },
            ])

            const result = await webhookService.listEndpoints()

            expect(result).toHaveLength(1)
            // 密钥应该被脱敏（只显示前4和后4位）
            expect(result[0].secret).toBe('abcd****7890')
        })
    })

    describe('updateEndpoint', () => {
        it('should update endpoint configuration', async () => {
            prismaMock.webhookEndpoint.update.mockResolvedValue({
                id: 'ep-1',
                isActive: false,
            })

            const _result = await webhookService.updateEndpoint('ep-1', { isActive: false })

            expect(prismaMock.webhookEndpoint.update).toHaveBeenCalledWith({
                where: { id: 'ep-1' },
                data: { isActive: false },
            })
        })
    })

    describe('deleteEndpoint', () => {
        it('should delete an endpoint', async () => {
            prismaMock.webhookEndpoint.delete.mockResolvedValue({ id: 'ep-1' })

            const result = await webhookService.deleteEndpoint('ep-1')

            expect(result.success).toBe(true)
            expect(prismaMock.webhookEndpoint.delete).toHaveBeenCalledWith({ where: { id: 'ep-1' } })
        })
    })

    describe('emit', () => {
        it('should not deliver if no endpoints subscribe to event', async () => {
            prismaMock.webhookEndpoint.findMany.mockResolvedValue([])

            await webhookService.emit('lead.created', { id: 'lead-1' })

            expect(prismaMock.webhookEndpoint.findMany).toHaveBeenCalledWith({
                where: { isActive: true, events: { has: 'lead.created' } },
            })
        })
    })

    describe('deliver', () => {
        it('should return failed result for unreachable URL', async () => {
            const result = await webhookService.deliver(
                'ep-1',
                'https://unreachable.example.com/webhook',
                'test-secret',
                { event: 'lead.created', timestamp: new Date().toISOString(), data: {} }
            )

            expect(result.endpointId).toBe('ep-1')
            expect(result.status).toBe('failed')
        })
    })

    describe('logDelivery', () => {
        it('should log delivery result', async () => {
            prismaMock.webhookLog.create.mockResolvedValue({ id: 'log-1' })

            await webhookService.logDelivery(
                { endpointId: 'ep-1', url: 'https://example.com', status: 'success', statusCode: 200 },
                { event: 'lead.created', timestamp: new Date().toISOString(), data: {} }
            )

            expect(prismaMock.webhookLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        endpointId: 'ep-1',
                        status: 'success',
                        statusCode: 200,
                    }),
                })
            )
        })
    })
})
