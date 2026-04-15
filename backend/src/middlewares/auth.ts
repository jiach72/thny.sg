import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { rbacService } from '../services/rbacService.js'
import logger from '../config/logger.js'

// 扩展 Express Request 类型
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string
                email: string
                role: string      // roleCode (如 "ADMIN", "SALES")
                roleId: string    // Role 表的 ID
            }
        }
    }
}

export interface JwtPayload {
    sub: string
    email: string
    role: string    // roleCode
    roleId: string  // Role 表 ID
    iat: number
    exp: number
}

// ==================== 自定义错误类 ====================

/** Token 已被撤销（黑名单中） */
class TokenRevokedError extends Error {
    constructor() {
        super('令牌已失效')
        this.name = 'TokenRevokedError'
    }
}

// ==================== 公共 Token 验证 ====================

/**
 * 统一的 Token 验证函数（单一职责）
 * 1. JWT 签名验证
 * 2. Token 黑名单检查（Redis，含降级）
 *
 * @throws jwt.TokenExpiredError - Token 已过期
 * @throws jwt.JsonWebTokenError - Token 无效
 * @throws TokenRevokedError     - Token 已被撤销
 */
async function verifyAndDecodeToken(token: string): Promise<JwtPayload> {
    // 1) 验证 JWT 签名和过期时间
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload

    // 2) 检查 Token 是否在黑名单中（已登出）
    try {
        const { tokenBlacklist } = await import('../config/redis.js')
        const isBlacklisted = await tokenBlacklist.isBlacklisted(token)
        if (isBlacklisted) {
            throw new TokenRevokedError()
        }
    } catch (error) {
        // TokenRevokedError 需要向上传播
        if (error instanceof TokenRevokedError) throw error
        // Redis 不可用时降级，跳过黑名单检查
        logger.warn('Token 黑名单检查跳过: Redis 不可用')
    }

    return decoded
}

/**
 * 从请求头提取 Bearer Token
 * @returns token 字符串，或 null（未提供）
 */
function extractBearerToken(req: Request): string | null {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }
    return authHeader.substring(7)
}

/**
 * 将 JwtPayload 映射为 req.user 对象
 */
function payloadToUser(decoded: JwtPayload): NonNullable<Request['user']> {
    return {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        roleId: decoded.roleId || '',
    }
}

/**
 * 统一的 Token 错误响应处理
 */
function handleTokenError(res: Response, error: unknown, context: string = '认证') {
    if (error instanceof TokenRevokedError) {
        return res.status(401).json({
            code: 'TOKEN_REVOKED',
            message: '令牌已失效，请重新登录',
        })
    }

    if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
            code: 'TOKEN_EXPIRED',
            message: `${context}令牌已过期`,
        })
    }

    return res.status(401).json({
        code: 'INVALID_TOKEN',
        message: `无效的${context}令牌`,
    })
}

// ==================== 认证中间件 ====================

/**
 * JWT 认证中间件（通用）
 * 验证 Token 有效性 + 黑名单检查，不限制角色
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = extractBearerToken(req)

    if (!token) {
        return res.status(401).json({
            code: 'UNAUTHORIZED',
            message: '未提供认证令牌',
        })
    }

    try {
        const decoded = await verifyAndDecodeToken(token)
        req.user = payloadToUser(decoded)
        next()
    } catch (error) {
        return handleTokenError(res, error, '认证')
    }
}

/**
 * 可选认证中间件 (不强制要求登录)
 * Token 无效时静默忽略，不阻断请求
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    const token = extractBearerToken(req)

    if (token) {
        try {
            const decoded = await verifyAndDecodeToken(token)
            req.user = payloadToUser(decoded)
        } catch {
            // 可选认证: 忽略错误，继续处理请求
        }
    }

    next()
}

/**
 * 客户专用认证中间件
 * 验证 Token + 黑名单检查 + 仅允许 CUSTOMER 角色
 */
export async function customerAuth(req: Request, res: Response, next: NextFunction) {
    const token = extractBearerToken(req)

    if (!token) {
        return res.status(401).json({
            code: 'UNAUTHORIZED',
            message: '请登录客户门户',
        })
    }

    try {
        const decoded = await verifyAndDecodeToken(token)

        if (decoded.role !== 'CUSTOMER') {
            return res.status(403).json({
                code: 'FORBIDDEN',
                message: '此接口仅限客户访问',
            })
        }

        req.user = payloadToUser(decoded)
        next()
    } catch (error) {
        return handleTokenError(res, error, '登录')
    }
}

/**
 * 管理端认证中间件
 * 验证 Token + 黑名单检查 + 禁止 CUSTOMER 角色
 */
export async function adminAuth(req: Request, res: Response, next: NextFunction) {
    const token = extractBearerToken(req)

    if (!token) {
        return res.status(401).json({
            code: 'UNAUTHORIZED',
            message: '请登录管理系统',
        })
    }

    try {
        const decoded = await verifyAndDecodeToken(token)

        if (decoded.role === 'CUSTOMER') {
            return res.status(403).json({
                code: 'FORBIDDEN',
                message: '客户无权访问管理系统',
            })
        }

        req.user = payloadToUser(decoded)
        next()
    } catch (error) {
        return handleTokenError(res, error, '登录')
    }
}

// ==================== 授权中间件 ====================

/**
 * 角色授权中间件 (基于角色代码检查)
 * @deprecated 建议使用 requirePermission 进行细粒度控制
 */
export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                code: 'UNAUTHORIZED',
                message: '未认证',
            })
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                code: 'FORBIDDEN',
                message: '无权限访问此资源',
            })
        }

        next()
    }
}

/**
 * 权限授权中间件 (RBAC 细粒度控制)
 * @param permissionCode 权限代码，如 "leads:create", "projects:delete"
 */
export function requirePermission(permissionCode: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                code: 'UNAUTHORIZED',
                message: '未登录',
            })
        }

        // ADMIN 超级权限兜底 (防止死锁)
        if (req.user.role === 'ADMIN') {
            return next()
        }

        try {
            const canAccess = await rbacService.hasPermission(req.user.role, permissionCode)

            if (!canAccess) {
                return res.status(403).json({
                    code: 'FORBIDDEN',
                    message: `权限不足: ${permissionCode}`,
                })
            }

            next()
        } catch (error) {
            logger.error('RBAC 检查失败:', error)
            return res.status(500).json({
                code: 'INTERNAL_ERROR',
                message: '权限检查失败',
            })
        }
    }
}
