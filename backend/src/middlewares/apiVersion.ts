import { Request, Response, NextFunction } from 'express'
import logger from '../config/logger.js'

// 当前最高支持版本
const CURRENT_VERSION = 'v1'

// 即将弃用的版本以及过期时间（供未来迭代使用）
const DEPRECATED_VERSIONS: Record<string, string> = {
    // 'v1': '2026-12-31'
}

/**
 * API 版本控制与约束拦截中间件
 * - 统一在响应头注入当前 API 版本
 * - 对即将弃用的版本加入 Warning Header
 * - 拒绝服务不再受支持的版本
 */
export const apiVersionMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // 例如 path: /api/v1/users => ['api', 'v1', 'users']
    const pathParts = req.path.split('/').filter(Boolean)
    const versionMatch = pathParts.length > 1 && pathParts[0] === 'api' ? pathParts[1] : null

    res.setHeader('X-API-Version', CURRENT_VERSION)

    if (versionMatch) {
        // 检查是否在弃用列表
        if (DEPRECATED_VERSIONS[versionMatch]) {
            const expiryDate = DEPRECATED_VERSIONS[versionMatch]
            res.setHeader('Warning', `199 - "API Version ${versionMatch} is deprecated and will be removed on ${expiryDate}."`)
            res.setHeader('X-API-Deprecation-Date', expiryDate)

            // 日志采集警告（可供后续分析有多少流氓客户端还在用老版本）
            logger.warn(`Deprecated API accessed`, {
                method: req.method,
                path: req.originalUrl,
                ip: req.ip,
                version: versionMatch
            })
        }

        // 可以在这里扩展拒绝极早期不受支持的版本的逻辑
        /*
        const unsupported = ['v0']
        if (unsupported.includes(versionMatch)) {
            return res.status(426).json({
                code: 426,
                message: `Upgrade Required: API version ${versionMatch} is no longer supported.`
            })
        }
        */
    }

    next()
}
