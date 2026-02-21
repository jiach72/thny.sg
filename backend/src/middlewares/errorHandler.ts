import { Request, Response, NextFunction } from 'express'
import { error } from '../utils/responseHelper.js'
import logger from '../config/logger.js'

// 自定义错误类
export class AppError extends Error {
    statusCode: number
    code: string

    constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message)
        this.statusCode = statusCode
        this.code = code
        Error.captureStackTrace(this, this.constructor)
    }
}

// 常用错误
export class NotFoundError extends AppError {
    constructor(message = '资源不存在') {
        super(message, 404, 'NOT_FOUND')
    }
}

export class BadRequestError extends AppError {
    constructor(message = '请求参数错误') {
        super(message, 400, 'BAD_REQUEST')
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = '未授权') {
        super(message, 401, 'UNAUTHORIZED')
    }
}

export class ForbiddenError extends AppError {
    constructor(message = '禁止访问') {
        super(message, 403, 'FORBIDDEN')
    }
}

export class ConflictError extends AppError {
    constructor(message = '资源冲突') {
        super(message, 409, 'CONFLICT')
    }
}

// 业务验证错误
export class ValidationError extends AppError {
    details?: Record<string, unknown>

    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 400, 'VALIDATION_ERROR')
        this.details = details
    }
}

// 业务逻辑错误
export class BusinessLogicError extends AppError {
    constructor(message: string, code = 'BUSINESS_ERROR') {
        super(message, 422, code)
    }
}

/**
 * 全局错误处理中间件
 */
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
) {
    logger.error('请求错误', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        path: req.path,
        context: 'errorHandler',
    })

    if (err instanceof AppError) {
        return res.status(err.statusCode).json(error(err.message, err.statusCode, err.code))
    }

    // Prisma 错误处理
    if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err as { code?: string }
        const errorCode = prismaError.code

        // P2002: Unique constraint failed
        if (errorCode === 'P2002') {
            return res.status(409).json(error('资源冲突：该记录已存在', 409, 'CONFLICT'))
        }

        // P2025: Record not found
        if (errorCode === 'P2025') {
            return res.status(404).json(error('未找到记录', 404, 'NOT_FOUND'))
        }

        return res.status(400).json(error('数据库操作失败', 400, 'DATABASE_ERROR'))
    }

    // 默认错误
    const msg = process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
    res.status(500).json(error(msg, 500, 'INTERNAL_ERROR'))
}

