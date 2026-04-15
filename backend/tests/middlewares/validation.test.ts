import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

const { mockValidationResult } = vi.hoisted(() => ({
    mockValidationResult: vi.fn(),
}))

vi.mock('express-validator', () => ({
    validationResult: mockValidationResult,
}))

import { validate } from '../../src/middlewares/validation.js'

function mockReq(overrides: Record<string, unknown> = {}): Partial<Request> {
    return { ...overrides } as Partial<Request>
}

function mockRes(): Partial<Response> {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as Partial<Response>
}

const mockNext: NextFunction = vi.fn()

describe('Validation Middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('无验证错误时应调用 next', () => {
        mockValidationResult.mockReturnValue({
            isEmpty: () => true,
            array: () => [],
        })

        const req = mockReq() as Request
        const res = mockRes() as Response

        validate(req, res, mockNext)

        expect(mockNext).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('有验证错误时应返回 400', () => {
        mockValidationResult.mockReturnValue({
            isEmpty: () => false,
            array: () => [
                { path: 'email', msg: '邮箱格式不正确' },
                { path: 'name', msg: '名称不能为空' },
            ],
        })

        const req = mockReq() as Request
        const res = mockRes() as Response

        validate(req, res, mockNext)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            code: 'VALIDATION_ERROR',
        }))
        expect(mockNext).not.toHaveBeenCalled()
    })

    it('错误对象无 path 字段时应使用 unknown', () => {
        mockValidationResult.mockReturnValue({
            isEmpty: () => false,
            array: () => [
                { msg: '未知错误' },
            ],
        })

        const req = mockReq() as Request
        const res = mockRes() as Response

        validate(req, res, mockNext)

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            details: expect.arrayContaining([
                expect.objectContaining({ field: 'unknown' }),
            ]),
        }))
    })
})
