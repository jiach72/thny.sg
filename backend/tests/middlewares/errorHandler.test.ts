import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import {
    errorHandler,
    AppError,
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    ValidationError,
    BusinessLogicError,
} from '../../src/middlewares/errorHandler.js'

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

function mockReq(overrides: Record<string, unknown> = {}): Partial<Request> {
    return {
        method: 'GET',
        path: '/api/v1/test',
        ...overrides,
    } as Partial<Request>
}

function mockRes(): Partial<Response> {
    return {
        statusCode: 200,
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as Partial<Response>
}

const mockNext: NextFunction = vi.fn()

describe('Error Handler', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('自定义错误类', () => {
        it('AppError 应有正确的属性', () => {
            const err = new AppError('test', 400, 'TEST_CODE')
            expect(err.message).toBe('test')
            expect(err.statusCode).toBe(400)
            expect(err.code).toBe('TEST_CODE')
            expect(err instanceof Error).toBe(true)
        })

        it('NotFoundError 默认消息为"资源不存在"', () => {
            const err = new NotFoundError()
            expect(err.statusCode).toBe(404)
            expect(err.code).toBe('NOT_FOUND')
            expect(err.message).toBe('资源不存在')
        })

        it('BadRequestError 默认消息为"请求参数错误"', () => {
            const err = new BadRequestError()
            expect(err.statusCode).toBe(400)
            expect(err.code).toBe('BAD_REQUEST')
        })

        it('UnauthorizedError 默认消息为"未授权"', () => {
            const err = new UnauthorizedError()
            expect(err.statusCode).toBe(401)
            expect(err.code).toBe('UNAUTHORIZED')
        })

        it('ForbiddenError 默认消息为"禁止访问"', () => {
            const err = new ForbiddenError()
            expect(err.statusCode).toBe(403)
            expect(err.code).toBe('FORBIDDEN')
        })

        it('ConflictError 默认消息为"资源冲突"', () => {
            const err = new ConflictError()
            expect(err.statusCode).toBe(409)
            expect(err.code).toBe('CONFLICT')
        })

        it('ValidationError 可包含详情', () => {
            const err = new ValidationError('验证失败', { field: 'email' })
            expect(err.statusCode).toBe(400)
            expect(err.code).toBe('VALIDATION_ERROR')
            expect(err.details).toEqual({ field: 'email' })
        })

        it('BusinessLogicError 默认代码为 BUSINESS_ERROR', () => {
            const err = new BusinessLogicError('业务异常')
            expect(err.statusCode).toBe(422)
            expect(err.code).toBe('BUSINESS_ERROR')
        })

        it('BusinessLogicError 可自定义代码', () => {
            const err = new BusinessLogicError('余额不足', 'INSUFFICIENT_BALANCE')
            expect(err.code).toBe('INSUFFICIENT_BALANCE')
        })
    })

    describe('errorHandler 中间件', () => {
        it('AppError 应返回对应状态码', () => {
            const err = new NotFoundError('找不到用户')
            const req = mockReq() as Request
            const res = mockRes() as Response

            errorHandler(err, req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 404,
                success: false,
                errorCode: 'NOT_FOUND',
            }))
        })

        it('Prisma P2002 错误应返回 409', () => {
            const err = new Error('Unique constraint failed')
            err.name = 'PrismaClientKnownRequestError'
            ;(err as any).code = 'P2002'
            const req = mockReq() as Request
            const res = mockRes() as Response

            errorHandler(err, req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(409)
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                errorCode: 'CONFLICT',
            }))
        })

        it('Prisma P2025 错误应返回 404', () => {
            const err = new Error('Record not found')
            err.name = 'PrismaClientKnownRequestError'
            ;(err as any).code = 'P2025'
            const req = mockReq() as Request
            const res = mockRes() as Response

            errorHandler(err, req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(404)
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                errorCode: 'NOT_FOUND',
            }))
        })

        it('其他 Prisma 错误应返回 400', () => {
            const err = new Error('Some prisma error')
            err.name = 'PrismaClientKnownRequestError'
            ;(err as any).code = 'P2003'
            const req = mockReq() as Request
            const res = mockRes() as Response

            errorHandler(err, req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                errorCode: 'DATABASE_ERROR',
            }))
        })

        it('未知错误应返回 500', () => {
            const err = new Error('Something went wrong')
            const req = mockReq() as Request
            const res = mockRes() as Response
            const originalEnv = process.env.NODE_ENV
            process.env.NODE_ENV = 'development'

            errorHandler(err, req, res, mockNext)

            expect(res.status).toHaveBeenCalledWith(500)
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                errorCode: 'INTERNAL_ERROR',
            }))

            process.env.NODE_ENV = originalEnv
        })

        it('生产环境应隐藏错误详情', () => {
            const err = new Error('Secret internal error')
            const req = mockReq() as Request
            const res = mockRes() as Response
            const originalEnv = process.env.NODE_ENV
            process.env.NODE_ENV = 'production'

            errorHandler(err, req, res, mockNext)

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: '服务器内部错误',
            }))

            process.env.NODE_ENV = originalEnv
        })
    })
})
