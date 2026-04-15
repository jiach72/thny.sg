import { describe, it, expect, vi } from 'vitest'

// 测试纯工具函数不需要 mock
vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import * as responseHelper from '../../src/utils/responseHelper.js'

describe('ResponseHelper', () => {
    describe('success', () => {
        it('应返回成功响应', () => {
            const result = responseHelper.success({ id: 1 }, '操作成功')
            expect(result).toEqual({
                code: 200,
                success: true,
                message: '操作成功',
                data: { id: 1 },
            })
        })

        it('默认消息为 Success', () => {
            const result = responseHelper.success({})
            expect(result.message).toBe('Success')
        })
    })

    describe('error', () => {
        it('应返回错误响应', () => {
            const result = responseHelper.error('出错了', 400, 'BAD_REQUEST')
            expect(result).toEqual({
                code: 400,
                success: false,
                message: '出错了',
                data: null,
                errorCode: 'BAD_REQUEST',
            })
        })

        it('默认状态码 500', () => {
            const result = responseHelper.error('Internal error')
            expect(result.code).toBe(500)
        })
    })

    describe('sendSuccess', () => {
        it('应发送 200 JSON 成功响应', () => {
            const mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            }

            responseHelper.sendSuccess(mockRes as any, { items: [] }, '查询成功')

            expect(mockRes.status).toHaveBeenCalledWith(200)
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, message: '查询成功' })
            )
        })
    })

    describe('sendError', () => {
        it('应发送错误 JSON 响应', () => {
            const mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            }

            responseHelper.sendError(mockRes as any, 'Not Found', 404, 'NOT_FOUND')

            expect(mockRes.status).toHaveBeenCalledWith(404)
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false, errorCode: 'NOT_FOUND' })
            )
        })

        it('默认状态码 500', () => {
            const mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            }

            responseHelper.sendError(mockRes as any, 'Server error')

            expect(mockRes.status).toHaveBeenCalledWith(500)
        })
    })
})
