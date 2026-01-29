import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { rbacService } from '../services/rbacService'

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

/**
 * JWT 认证中间件
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            code: 'UNAUTHORIZED',
            message: '未提供认证令牌',
        })
    }

    const token = authHeader.substring(7)

    try {
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload

        req.user = {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role,
            roleId: decoded.roleId || '',
        }

        next()
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                code: 'TOKEN_EXPIRED',
                message: '认证令牌已过期',
            })
        }

        return res.status(401).json({
            code: 'INVALID_TOKEN',
            message: '无效的认证令牌',
        })
    }
}

/**
 * 可选认证中间件 (不强制要求登录)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)

        try {
            const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload
            req.user = {
                id: decoded.sub,
                email: decoded.email,
                role: decoded.role,
                roleId: decoded.roleId || '',
            }
        } catch {
            // 忽略错误，继续处理请求
        }
    }

    next()
}

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
            console.error('RBAC 检查失败:', error)
            return res.status(500).json({
                code: 'INTERNAL_ERROR',
                message: '权限检查失败',
            })
        }
    }
}

/**
 * 客户专用认证中间件
 * 仅允许 CUSTOMER 角色访问，用于客户门户 API
 */
export function customerAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            code: 'UNAUTHORIZED',
            message: '请登录客户门户',
        })
    }

    const token = authHeader.substring(7)

    try {
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload

        if (decoded.role !== 'CUSTOMER') {
            return res.status(403).json({
                code: 'FORBIDDEN',
                message: '此接口仅限客户访问',
            })
        }

        req.user = {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role,
            roleId: decoded.roleId,
        }

        next()
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                code: 'TOKEN_EXPIRED',
                message: '登录已过期，请重新登录',
            })
        }

        return res.status(401).json({
            code: 'INVALID_TOKEN',
            message: '无效的登录凭证',
        })
    }
}

/**
 * 管理端认证中间件
 * 禁止 CUSTOMER 角色访问，用于 CRM 管理端 API
 */
export function adminAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            code: 'UNAUTHORIZED',
            message: '请登录管理系统',
        })
    }

    const token = authHeader.substring(7)

    try {
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload

        if (decoded.role === 'CUSTOMER') {
            return res.status(403).json({
                code: 'FORBIDDEN',
                message: '客户无权访问管理系统',
            })
        }

        req.user = {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role,
            roleId: decoded.roleId,
        }

        next()
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                code: 'TOKEN_EXPIRED',
                message: '登录已过期',
            })
        }

        return res.status(401).json({
            code: 'INVALID_TOKEN',
            message: '无效的登录凭证',
        })
    }
}
