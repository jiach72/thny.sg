import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

const { mockLogAction } = vi.hoisted(() => ({
    mockLogAction: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/services/auditService.js', () => ({
    auditService: { logAction: mockLogAction },
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { auditAction } from '../../src/middlewares/auditMiddleware.js'

function mockReq(overrides: Record<string, unknown> = {}): Partial<Request> {
    return {
        params: {},
        body: {},
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
        socket: { remoteAddress: '127.0.0.1' } as any,
        ...overrides,
    } as Partial<Request>
}

function mockRes(): Partial<Response> {
    return {} as Partial<Response>
}

const mockNext: NextFunction = vi.fn()

describe('Audit Middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('已认证用户应记录审计日志', async () => {
        const req = mockReq({
            user: { id: 'user-1', email: 't@t', role: 'ADMIN', roleId: 'r1' },
            params: { id: 'resource-1' },
        }) as Request
        const res = mockRes() as Response
        const middleware = auditAction('CREATE', 'lead')

        await middleware(req, res, mockNext)

        expect(mockNext).toHaveBeenCalled()
        await new Promise(r => setTimeout(r, 10))
        expect(mockLogAction).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'user-1',
            action: 'CREATE',
            resource: 'lead',
            resourceId: 'resource-1',
        }))
    })

    it('未认证用户不应记录审计日志', async () => {
        const req = mockReq() as Request
        const res = mockRes() as Response
        const middleware = auditAction('DELETE', 'project')

        await middleware(req, res, mockNext)

        expect(mockNext).toHaveBeenCalled()
        await new Promise(r => setTimeout(r, 10))
        expect(mockLogAction).not.toHaveBeenCalled()
    })

    it('应从 body.id 获取 resourceId', async () => {
        const req = mockReq({
            user: { id: 'user-1', email: 't@t', role: 'ADMIN', roleId: 'r1' },
            body: { id: 'body-resource-id' },
        }) as Request
        const res = mockRes() as Response
        const middleware = auditAction('UPDATE', 'customer')

        await middleware(req, res, mockNext)

        await new Promise(r => setTimeout(r, 10))
        expect(mockLogAction).toHaveBeenCalledWith(expect.objectContaining({
            resourceId: 'body-resource-id',
        }))
    })

    it('审计日志错误不应阻断请求', async () => {
        mockLogAction.mockRejectedValueOnce(new Error('DB error'))
        const req = mockReq({
            user: { id: 'user-1', email: 't@t', role: 'ADMIN', roleId: 'r1' },
        }) as Request
        const res = mockRes() as Response
        const middleware = auditAction('READ', 'invoice')

        await middleware(req, res, mockNext)

        expect(mockNext).toHaveBeenCalled()
    })

    it('无 params.id 和 body.id 时 resourceId 应为 undefined', async () => {
        const req = mockReq({
            user: { id: 'user-1', email: 't@t', role: 'ADMIN', roleId: 'r1' },
        }) as Request
        const res = mockRes() as Response
        const middleware = auditAction('LIST', 'invoice')

        await middleware(req, res, mockNext)

        await new Promise(r => setTimeout(r, 10))
        expect(mockLogAction).toHaveBeenCalledWith(expect.objectContaining({
            resourceId: undefined,
        }))
    })
})
