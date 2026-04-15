import { describe, it, expect, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

const { loggerMock } = vi.hoisted(() => ({
    loggerMock: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('../../src/config/logger.js', () => ({
    default: loggerMock,
}))

import {
    apiCacheHeaders,
    originValidation,
    sensitiveActionAudit,
} from '../../src/middlewares/securityMiddleware.js'

function mockReq(overrides: Record<string, unknown> = {}): Partial<Request> {
    return {
        method: 'GET',
        path: '/api/v1/users',
        headers: {},
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' } as any,
        ...overrides,
    } as Partial<Request>
}

function mockRes(): Partial<Response> {
    return {
        set: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as Partial<Response>
}

const mockNext: NextFunction = vi.fn()

describe('Security Middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('apiCacheHeaders', () => {
        it('健康检查端点应设置 30 秒缓存', () => {
            const req = mockReq({ path: '/api/v1/health', method: 'GET' }) as Request
            const res = mockRes() as Response

            apiCacheHeaders(req, res, mockNext)

            expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=30')
            expect(mockNext).toHaveBeenCalled()
        })

        it('/health 端点应设置短缓存', () => {
            const req = mockReq({ path: '/health', method: 'GET' }) as Request
            const res = mockRes() as Response

            apiCacheHeaders(req, res, mockNext)

            expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=30')
        })

        it('数据 API 应设置 no-cache', () => {
            const req = mockReq({ path: '/api/v1/users', method: 'GET' }) as Request
            const res = mockRes() as Response

            apiCacheHeaders(req, res, mockNext)

            expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-cache')
        })

        it('非 GET 请求应跳过缓存头设置', () => {
            const req = mockReq({ method: 'POST' }) as Request
            const res = mockRes() as Response

            apiCacheHeaders(req, res, mockNext)

            expect(res.set).not.toHaveBeenCalled()
            expect(mockNext).toHaveBeenCalled()
        })
    })

    describe('originValidation', () => {
        it('非状态变更方法应跳过验证', () => {
            const req = mockReq({ method: 'GET' }) as Request
            const res = mockRes() as Response

            originValidation(req, res, mockNext)

            expect(mockNext).toHaveBeenCalled()
        })

        it('webhook 路径应跳过验证', () => {
            const req = mockReq({
                method: 'POST',
                path: '/api/v1/portal/payments/webhook',
            }) as Request
            const res = mockRes() as Response

            originValidation(req, res, mockNext)

            expect(mockNext).toHaveBeenCalled()
        })

        it('/api/v1/webhooks 路径应跳过验证', () => {
            const req = mockReq({
                method: 'POST',
                path: '/api/v1/webhooks/stripe',
            }) as Request
            const res = mockRes() as Response

            originValidation(req, res, mockNext)

            expect(mockNext).toHaveBeenCalled()
        })

        it('无 origin 和 referer 头时应放行', () => {
            const req = mockReq({
                method: 'POST',
                headers: {},
            }) as Request
            const res = mockRes() as Response

            originValidation(req, res, mockNext)

            expect(mockNext).toHaveBeenCalled()
        })

        it('POST 请求有匹配 origin 时应放行', () => {
            process.env.WEBSITE_URL = 'https://example.com'
            const req = mockReq({
                method: 'POST',
                headers: { origin: 'https://example.com' },
            }) as Request
            const res = mockRes() as Response

            originValidation(req, res, mockNext)

            expect(mockNext).toHaveBeenCalled()
            delete process.env.WEBSITE_URL
        })

        it('不匹配的 origin 应记录警告但仍放行', () => {
            process.env.WEBSITE_URL = 'https://example.com'
            const req = mockReq({
                method: 'POST',
                headers: { origin: 'https://evil.com' },
            }) as Request
            const res = mockRes() as Response

            originValidation(req, res, mockNext)

            expect(loggerMock.warn).toHaveBeenCalled()
            expect(mockNext).toHaveBeenCalled()
            delete process.env.WEBSITE_URL
        })

        it('无允许域名配置时应放行', () => {
            delete process.env.WEBSITE_URL
            delete process.env.MANAGEMENT_URL
            delete process.env.PORTAL_URL
            const req = mockReq({
                method: 'POST',
                headers: { origin: 'https://unknown.com' },
            }) as Request
            const res = mockRes() as Response

            originValidation(req, res, mockNext)

            expect(mockNext).toHaveBeenCalled()
        })
    })

    describe('sensitiveActionAudit', () => {
        it('敏感路径应记录审计日志', () => {
            const req = mockReq({
                method: 'POST',
                path: '/api/v1/auth/login',
                headers: { 'user-agent': 'Mozilla/5.0' },
            }) as Request
            const res = mockRes() as Response

            sensitiveActionAudit(req, res, mockNext)

            expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('[AUDIT]'))
            expect(mockNext).toHaveBeenCalled()
        })

        it('非敏感路径不应记录审计日志', () => {
            const req = mockReq({
                method: 'GET',
                path: '/api/v1/leads',
            }) as Request
            const res = mockRes() as Response

            sensitiveActionAudit(req, res, mockNext)

            expect(loggerMock.info).not.toHaveBeenCalledWith(expect.stringContaining('[AUDIT]'))
            expect(mockNext).toHaveBeenCalled()
        })

        it('其他敏感路径应记录', () => {
            const req = mockReq({
                method: 'POST',
                path: '/api/v1/auth/register',
                headers: { 'user-agent': 'test' },
            }) as Request
            const res = mockRes() as Response

            sensitiveActionAudit(req, res, mockNext)

            expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('[AUDIT]'))
        })
    })
})
