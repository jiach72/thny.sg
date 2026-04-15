import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Mock jwt
vi.mock('jsonwebtoken', () => ({
    default: {
        verify: vi.fn(),
        TokenExpiredError: class TokenExpiredError extends Error {
            constructor(msg: string) {
                super(msg)
                this.name = 'TokenExpiredError'
            }
        },
        JsonWebTokenError: class JsonWebTokenError extends Error {
            constructor(msg: string) {
                super(msg)
                this.name = 'JsonWebTokenError'
            }
        },
    },
}))

// Mock config
vi.mock('../../src/config/env.js', () => ({
    config: {
        jwt: {
            secret: 'test-secret',
            refreshSecret: 'test-refresh-secret',
            expiresIn: '15m',
            refreshExpiresIn: '7d',
        },
    },
}))

// Mock redis tokenBlacklist
const mockIsBlacklisted = vi.fn()
vi.mock('../../src/config/redis.js', () => ({
    tokenBlacklist: { isBlacklisted: mockIsBlacklisted },
    isRedisConnected: true,
}))

// Mock rbacService
vi.mock('../../src/services/rbacService.js', () => ({
    rbacService: { hasPermission: vi.fn() },
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import {
    authMiddleware,
    optionalAuth,
    customerAuth,
    adminAuth,
    requireRole,
    requirePermission,
} from '../../src/middlewares/auth.js'

function mockReq(overrides: Record<string, unknown> = {}): Partial<Request> {
    return {
        headers: {},
        method: 'GET',
        path: '/api/v1/test',
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' } as any,
        ...overrides,
    } as Partial<Request>
}

function mockRes(): Partial<Response> {
    const res: Partial<Response> = {
        statusCode: 200,
        body: null,
        status: vi.fn().mockImplementation(function (this: Partial<Response>, code: number) {
            this.statusCode = code
            return this
        }),
        json: vi.fn().mockImplementation(function (this: Partial<Response>, data: unknown) {
            this.body = data
            return this
        }),
        setHeader: vi.fn(),
    }
    return res
}

const mockNext: NextFunction = vi.fn()

describe('Auth Middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockIsBlacklisted.mockResolvedValue(false)
    })

    describe('authMiddleware', () => {
        it('未提供 Token 时应返回 401', async () => {
            const req = mockReq() as Request
            const res = mockRes() as Response

            await authMiddleware(req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'UNAUTHORIZED' }))
            expect(mockNext).not.toHaveBeenCalled()
        })

        it('有效 Token 应调用 next', async () => {
            const req = mockReq({
                headers: { authorization: 'Bearer valid-token' },
            }) as Request
            const res = mockRes() as Response
            vi.mocked(jwt.verify).mockReturnValue({
                sub: 'user-1',
                email: 'test@test.com',
                role: 'ADMIN',
                roleId: 'role-1',
                iat: Date.now(),
                exp: Date.now() + 900000,
            } as any)

            await authMiddleware(req, res, mockNext)

            expect(mockNext).toHaveBeenCalled()
            expect((req as any).user).toEqual({
                id: 'user-1',
                email: 'test@test.com',
                role: 'ADMIN',
                roleId: 'role-1',
            })
        })

        it('Token 已过期时应返回 401 TOKEN_EXPIRED', async () => {
            const req = mockReq({
                headers: { authorization: 'Bearer expired-token' },
            }) as Request
            const res = mockRes() as Response
            vi.mocked(jwt.verify).mockImplementation(() => {
                throw new (jwt.TokenExpiredError as any)('jwt expired')
            })

            await authMiddleware(req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TOKEN_EXPIRED' }))
        })

        it('无效 Token 应返回 401 INVALID_TOKEN', async () => {
            const req = mockReq({
                headers: { authorization: 'Bearer bad-token' },
            }) as Request
            const res = mockRes() as Response
            vi.mocked(jwt.verify).mockImplementation(() => {
                throw new (jwt.JsonWebTokenError as any)('invalid signature')
            })

            await authMiddleware(req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_TOKEN' }))
        })

        it('Token 在黑名单中应返回 401 TOKEN_REVOKED', async () => {
            const req = mockReq({
                headers: { authorization: 'Bearer revoked-token' },
            }) as Request
            const res = mockRes() as Response
            vi.mocked(jwt.verify).mockReturnValue({
                sub: 'user-1', email: 'test@test.com', role: 'ADMIN', roleId: 'role-1',
                iat: Date.now(), exp: Date.now() + 900000,
            } as any)
            mockIsBlacklisted.mockResolvedValue(true)

            await authMiddleware(req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TOKEN_REVOKED' }))
        })

        it('Redis 不可用时应跳过黑名单检查', async () => {
            const req = mockReq({
                headers: { authorization: 'Bearer valid-token' },
            }) as Request
            const res = mockRes() as Response
            vi.mocked(jwt.verify).mockReturnValue({
                sub: 'user-1', email: 'test@test.com', role: 'ADMIN', roleId: 'role-1',
                iat: Date.now(), exp: Date.now() + 900000,
            } as any)
            mockIsBlacklisted.mockRejectedValue(new Error('Redis down'))

            await authMiddleware(req, res, mockNext)

            expect(mockNext).toHaveBeenCalled()
        })
    })

    describe('optionalAuth', () => {
        it('无 Token 时应直接 next', async () => {
            const req = mockReq() as Request
            const res = mockRes() as Response

            await optionalAuth(req, res, mockNext)

            expect(mockNext).toHaveBeenCalled()
        })

        it('有效 Token 时应设置 user', async () => {
            const req = mockReq({
                headers: { authorization: 'Bearer valid-token' },
            }) as Request
            const res = mockRes() as Response
            vi.mocked(jwt.verify).mockReturnValue({
                sub: 'user-1', email: 'test@test.com', role: 'ADMIN', roleId: 'role-1',
                iat: Date.now(), exp: Date.now() + 900000,
            } as any)

            await optionalAuth(req, res, mockNext)

            expect(mockNext).toHaveBeenCalled()
            expect((req as any).user).toBeDefined()
        })

        it('无效 Token 时应静默忽略', async () => {
            const req = mockReq({
                headers: { authorization: 'Bearer bad-token' },
            }) as Request
            const res = mockRes() as Response
            vi.mocked(jwt.verify).mockImplementation(() => {
                throw new Error('bad token')
            })

            await optionalAuth(req, res, mockNext)

            expect(mockNext).toHaveBeenCalled()
            expect((req as any).user).toBeUndefined()
        })
    })

    describe('customerAuth', () => {
        it('未提供 Token 时应返回 401', async () => {
            const req = mockReq() as Request
            const res = mockRes() as Response

            await customerAuth(req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(401)
        })

        it('CUSTOMER 角色应通过', async () => {
            const req = mockReq({
                headers: { authorization: 'Bearer valid-token' },
            }) as Request
            const res = mockRes() as Response
            vi.mocked(jwt.verify).mockReturnValue({
                sub: 'cust-1', email: 'cust@test.com', role: 'CUSTOMER', roleId: 'role-c',
                iat: Date.now(), exp: Date.now() + 900000,
            } as any)

            await customerAuth(req, res, mockNext)

            expect(mockNext).toHaveBeenCalled()
        })

        it('非 CUSTOMER 角色应返回 403', async () => {
            const req = mockReq({
                headers: { authorization: 'Bearer valid-token' },
            }) as Request
            const res = mockRes() as Response
            vi.mocked(jwt.verify).mockReturnValue({
                sub: 'user-1', email: 'admin@test.com', role: 'ADMIN', roleId: 'role-a',
                iat: Date.now(), exp: Date.now() + 900000,
            } as any)

            await customerAuth(req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(403)
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'FORBIDDEN' }))
        })
    })

    describe('adminAuth', () => {
        it('CUSTOMER 角色应返回 403', async () => {
            const req = mockReq({
                headers: { authorization: 'Bearer valid-token' },
            }) as Request
            const res = mockRes() as Response
            vi.mocked(jwt.verify).mockReturnValue({
                sub: 'cust-1', email: 'cust@test.com', role: 'CUSTOMER', roleId: 'role-c',
                iat: Date.now(), exp: Date.now() + 900000,
            } as any)

            await adminAuth(req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(403)
        })

        it('非 CUSTOMER 角色（如 ADMIN）应通过', async () => {
            const req = mockReq({
                headers: { authorization: 'Bearer valid-token' },
            }) as Request
            const res = mockRes() as Response
            vi.mocked(jwt.verify).mockReturnValue({
                sub: 'user-1', email: 'admin@test.com', role: 'ADMIN', roleId: 'role-a',
                iat: Date.now(), exp: Date.now() + 900000,
            } as any)

            await adminAuth(req, res, mockNext)

            expect(mockNext).toHaveBeenCalled()
        })
    })

    describe('requireRole', () => {
        it('未认证用户应返回 401', () => {
            const req = mockReq() as Request
            const res = mockRes() as Response
            const middleware = requireRole('ADMIN')

            middleware(req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(401)
        })

        it('角色匹配时应通过', () => {
            const req = mockReq({ user: { id: '1', email: 't@t', role: 'ADMIN', roleId: 'r1' } }) as Request
            const res = mockRes() as Response
            const middleware = requireRole('ADMIN')

            middleware(req, res, mockNext)

            expect(mockNext).toHaveBeenCalled()
        })

        it('角色不匹配时应返回 403', () => {
            const req = mockReq({ user: { id: '1', email: 't@t', role: 'SALES', roleId: 'r1' } }) as Request
            const res = mockRes() as Response
            const middleware = requireRole('ADMIN')

            middleware(req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(403)
        })
    })

    describe('requirePermission', () => {
        it('未认证用户应返回 401', async () => {
            const req = mockReq() as Request
            const res = mockRes() as Response
            const middleware = requirePermission('leads:create')

            await middleware(req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(401)
        })

        it('ADMIN 角色应直接通过（超级权限）', async () => {
            const req = mockReq({ user: { id: '1', email: 't@t', role: 'ADMIN', roleId: 'r1' } }) as Request
            const res = mockRes() as Response
            const middleware = requirePermission('leads:create')

            await middleware(req, res, mockNext)

            expect(mockNext).toHaveBeenCalled()
        })

        it('有权限的角色应通过', async () => {
            const { rbacService } = await import('../../src/services/rbacService.js')
            vi.mocked(rbacService.hasPermission).mockResolvedValue(true)
            const req = mockReq({ user: { id: '1', email: 't@t', role: 'SALES', roleId: 'r1' } }) as Request
            const res = mockRes() as Response
            const middleware = requirePermission('leads:create')

            await middleware(req, res, mockNext)

            expect(mockNext).toHaveBeenCalled()
        })

        it('无权限的角色应返回 403', async () => {
            const { rbacService } = await import('../../src/services/rbacService.js')
            vi.mocked(rbacService.hasPermission).mockResolvedValue(false)
            const req = mockReq({ user: { id: '1', email: 't@t', role: 'SALES', roleId: 'r1' } }) as Request
            const res = mockRes() as Response
            const middleware = requirePermission('admin:delete')

            await middleware(req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(403)
        })

        it('RBAC 检查失败应返回 500', async () => {
            const { rbacService } = await import('../../src/services/rbacService.js')
            vi.mocked(rbacService.hasPermission).mockRejectedValue(new Error('DB error'))
            const req = mockReq({ user: { id: '1', email: 't@t', role: 'SALES', roleId: 'r1' } }) as Request
            const res = mockRes() as Response
            const middleware = requirePermission('leads:create')

            await middleware(req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(500)
        })
    })
})
