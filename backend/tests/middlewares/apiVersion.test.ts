import { describe, it, expect, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { apiVersionMiddleware } from '../../src/middlewares/apiVersion.js'

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

function mockReq(overrides: Record<string, unknown> = {}): Partial<Request> {
    return {
        path: '/api/v1/users',
        method: 'GET',
        originalUrl: '/api/v1/users',
        ip: '127.0.0.1',
        ...overrides,
    } as Partial<Request>
}

function mockRes(): Partial<Response> {
    return {
        setHeader: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as Partial<Response>
}

const mockNext: NextFunction = vi.fn()

describe('API Version Middleware', () => {
    it('应设置 X-API-Version 头', () => {
        const req = mockReq() as Request
        const res = mockRes() as Response

        apiVersionMiddleware(req, res, mockNext)

        expect(res.setHeader).toHaveBeenCalledWith('X-API-Version', 'v1')
        expect(mockNext).toHaveBeenCalled()
    })

    it('非 API 路径也应设置版本头', () => {
        const req = mockReq({ path: '/health' }) as Request
        const res = mockRes() as Response

        apiVersionMiddleware(req, res, mockNext)

        expect(res.setHeader).toHaveBeenCalledWith('X-API-Version', 'v1')
    })

    it('当前无弃用版本时不应设置 Warning 头', () => {
        const req = mockReq() as Request
        const res = mockRes() as Response

        apiVersionMiddleware(req, res, mockNext)

        // DEPRECATED_VERSIONS 为空，不应设置 Warning 头
        const calls = vi.mocked(res.setHeader).mock.calls
        const warningCall = calls.find(c => c[0] === 'Warning')
        expect(warningCall).toBeUndefined()
    })
})
