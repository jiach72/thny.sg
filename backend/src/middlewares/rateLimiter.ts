/**
 * 速率限制中间件
 * 保护认证端点免受暴力破解和 DDoS 攻击
 */
import rateLimit from 'express-rate-limit'

/**
 * 认证端点速率限制
 * 登录/注册/密码设置等敏感操作
 * 限制：每 15 分钟最多 5 次失败尝试
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟窗口
    max: 5, // 每窗口最多 5 次请求
    skipSuccessfulRequests: true, // 不计算成功请求
    message: {
        code: 'RATE_LIMITED',
        message: '请求过于频繁，请 15 分钟后重试',
    },
    standardHeaders: true, // 返回 RateLimit-* 标准头
    legacyHeaders: false, // 禁用 X-RateLimit-* 旧版头
    // 使用默认的 keyGenerator（req.ip），已内建 IPv6 规范化处理
    // 反向代理场景请在 Express 层面配置 app.set('trust proxy', 1)
})

/**
 * Token 刷新速率限制
 * 相对宽松，每分钟最多 10 次
 */
export const refreshRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 分钟窗口
    max: 10,
    message: {
        code: 'RATE_LIMITED',
        message: '刷新请求过于频繁，请稍后重试',
    },
    standardHeaders: true,
    legacyHeaders: false,
})

/**
 * 通用 API 速率限制
 * 防止 API 滥用
 */
export const apiRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 分钟窗口
    max: 100, // 每分钟最多 100 次请求
    message: {
        code: 'RATE_LIMITED',
        message: 'API 请求过于频繁',
    },
    standardHeaders: true,
    legacyHeaders: false,
})
