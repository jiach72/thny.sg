import { Request, Response, NextFunction } from 'express'
import { auditService } from '../services/auditService.js'

/**
 * 审计中间件工厂
 * 用于装饰需要审计的路由
 */
export function auditAction(action: string, resource: string) {
    return async (req: Request, _res: Response, next: NextFunction) => {
        // 异步写入审计日志，不阻塞请求
        if (req.user) {
            const resourceId = req.params.id || (req.body as Record<string, unknown>)?.id as string || undefined

            auditService.logAction({
                userId: req.user.id,
                action,
                resource,
                resourceId,
                ipAddress: req.ip || req.socket.remoteAddress,
                userAgent: req.headers['user-agent'],
            }).catch(() => {
                // 错误已在 auditService 中记录
            })
        }
        next()
    }
}
