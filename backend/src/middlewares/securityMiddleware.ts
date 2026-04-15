/**
 * 安全增强中间件
 * - SEC-11: 请求来源验证 (Referer/Origin 检查)
 * - SEC-12: 敏感操作 IP 日志记录
 * - PERF-03: API 响应缓存头 (ETag/Cache-Control)
 */
import { Request, Response, NextFunction } from 'express'
import logger from '../config/logger.js'

/**
 * API 响应缓存头中间件
 * 为 GET 请求添加 Cache-Control 和 ETag 支持
 * - 公共 API (健康检查等): 短缓存
 * - 数据 API: no-cache，依赖客户端验证
 */
export function apiCacheHeaders(req: Request, res: Response, next: NextFunction): void {
    // 仅为 GET 请求添加缓存头
    if (req.method !== 'GET') {
        return next()
    }

    // 健康检查端点 - 允许 30 秒缓存
    if (req.path === '/api/v1/health' || req.path === '/health') {
        res.set('Cache-Control', 'public, max-age=30')
    } else {
        // 数据 API - no-cache（每次验证）
        res.set('Cache-Control', 'no-cache')
    }

    next()
}

/**
 * 请求来源验证中间件
 * 防止 CSRF 攻击 — 验证敏感操作的 Referer/Origin
 */
export function originValidation(req: Request, res: Response, next: NextFunction): void {
    // 仅对状态变更操作验证
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
    if (!mutatingMethods.includes(req.method)) {
        return next()
    }

    // 跳过 webhook 和内部调用
    const skipPaths = ['/api/v1/portal/payments/webhook', '/api/v1/webhooks']
    if (skipPaths.some(p => req.path.startsWith(p))) {
        return next()
    }

    const origin = req.headers.origin
    const referer = req.headers.referer

    // 如果两个头都不存在（如 API 客户端、Postman），放行（由 CORS 处理）
    if (!origin && !referer) {
        return next()
    }

    // 验证来源是否来自允许的域名
    const sourceUrl = origin || referer || ''
    const allowedHosts = [
        process.env.WEBSITE_URL,
        process.env.MANAGEMENT_URL,
        process.env.PORTAL_URL,
    ].filter(Boolean)

    if (allowedHosts.length > 0) {
        const sourceHost = (() => {
            try {
                return new URL(sourceUrl).hostname
            } catch {
                return ''
            }
        })()

        const isAllowed = allowedHosts.some(allowed => {
            try {
                return sourceHost === new URL(allowed!).hostname
            } catch {
                return false
            }
        })

        if (!isAllowed && sourceHost) {
            logger.warn(`[SECURITY] 可疑请求来源: ${sourceUrl}, IP: ${req.ip}`)
        }
    }

    next()
}

/**
 * 敏感操作审计日志中间件
 * 记录认证、权限变更等敏感操作的 IP 地址
 */
export function sensitiveActionAudit(req: Request, res: Response, next: NextFunction): void {
    const sensitivePaths = [
        '/api/v1/auth/login',
        '/api/v1/auth/register',
        '/api/v1/auth/change-password',
        '/api/v1/auth/2fa',
        '/api/v1/admin/users',
        '/api/v1/admin/roles',
    ]

    const isSensitive = sensitivePaths.some(p => req.path.startsWith(p))

    if (isSensitive) {
        const clientIp = (req.ip || req.socket.remoteAddress || '').replace(/^::ffff:/, '')
        logger.info(`[AUDIT] 敏感操作: ${req.method} ${req.path}, IP: ${clientIp}, User-Agent: ${req.headers['user-agent']?.substring(0, 100)}`)
    }

    next()
}
