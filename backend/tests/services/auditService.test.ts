import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    auditLog: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
    },
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { auditService } from '../../src/services/auditService.js'

describe('AuditService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('logAction', () => {
        it('应成功记录审计事件', async () => {
            prismaMock.auditLog.create.mockResolvedValue({ id: '1' })

            await auditService.logAction({
                userId: 'u1',
                action: 'CREATE',
                resource: 'lead',
                resourceId: 'l1',
            })

            expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 'u1',
                    action: 'CREATE',
                    resource: 'lead',
                    resourceId: 'l1',
                }),
            })
        })

        it('应支持可选字段', async () => {
            prismaMock.auditLog.create.mockResolvedValue({ id: '1' })

            await auditService.logAction({
                userId: 'u1',
                action: 'LOGIN',
                resource: 'auth',
                ipAddress: '127.0.0.1',
                userAgent: 'Chrome',
                details: { key: 'value' },
            })

            expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        ipAddress: '127.0.0.1',
                        userAgent: 'Chrome',
                    }),
                })
            )
        })

        it('写入失败不应抛出异常', async () => {
            prismaMock.auditLog.create.mockRejectedValue(new Error('DB error'))

            await expect(
                auditService.logAction({ userId: 'u1', action: 'CREATE', resource: 'lead' })
            ).resolves.toBeUndefined()
        })
    })

    describe('getAuditLogs', () => {
        it('应返回分页审计日志', async () => {
            const mockLogs = [{ id: '1', action: 'CREATE', user: { name: 'Admin' } }]
            prismaMock.auditLog.findMany.mockResolvedValue(mockLogs)
            prismaMock.auditLog.count.mockResolvedValue(1)

            const result = await auditService.getAuditLogs({})

            expect(result.data).toEqual(mockLogs)
            expect(result.pagination.total).toBe(1)
        })

        it('应支持筛选条件', async () => {
            prismaMock.auditLog.findMany.mockResolvedValue([])
            prismaMock.auditLog.count.mockResolvedValue(0)

            await auditService.getAuditLogs({
                userId: 'u1',
                action: 'CREATE',
                resource: 'lead',
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                page: 2,
                limit: 50,
            })

            expect(prismaMock.auditLog.findMany).toHaveBeenCalled()
        })

        it('应限制limit不超过100', async () => {
            prismaMock.auditLog.findMany.mockResolvedValue([])
            prismaMock.auditLog.count.mockResolvedValue(0)

            await auditService.getAuditLogs({ limit: 200 })

            expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ take: 100 })
            )
        })
    })
})
