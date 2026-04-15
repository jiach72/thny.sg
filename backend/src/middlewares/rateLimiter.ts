/**
 * 速率限制中间件
 * 保护认证端点免受暴力破解和 DDoS 攻击
 * 
 * SEC-09: 使用 Redis 存储限流计数（多实例部署一致性）
 * PERF-02: 生产环境收紧通用 API 限流至 60次/分钟
 */
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { getRedis, isRedisConnected } from '../config/redis.js'
import { config } from '../config/env.js'
import logger from '../config/logger.js'

/**
 * 创建 Redis Store（如果 Redis 可用）
 * 降级策略：Redis 不可用时回退到内存存储（单实例模式下仍有效）
 */
function createRedisStoreIfAvailable(): RedisStore | undefined {
    if (isRedisConnected) {
        try {
            const redisClient = getRedis()
            logger.info('Rate Limiter 使用 Redis 存储')
            return new RedisStore({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                sendCommand: (...args: string[]) => redisClient.call(...args as [string, ...string[]]) as any,
            }) as unknown as RedisStore
        } catch (error) {
            logger.warn('Rate Limiter Redis 存储创建失败，回退到内存存储:', error)
        }
    }
    logger.info('Rate Limiter 使用内存存储（Redis 不可用）')
    return undefined
}

/**
 * 认证端点速率限制
 * 登录/注册/密码设置等敏感操作
 * 限制：每 15 分钟最多 5 次失败尝试
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟窗口
    max: 5, // 每窗口最多 5 次请求
    skipSuccessfulRequests: true, // 不计算成功请求
    store: createRedisStoreIfAvailable(),
    message: {
        code: 'RATE_LIMITED',
        message: '请求过于频繁，请 15 分钟后重试',
    },
    standardHeaders: true, // 返回 RateLimit-* 标准头
    legacyHeaders: false, // 禁用 X-RateLimit-* 旧版头
})

/**
 * Token 刷新速率限制
 * 相对宽松，每分钟最多 10 次
 */
export const refreshRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 分钟窗口
    max: 10,
    store: createRedisStoreIfAvailable(),
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
 * PERF-02: 生产环境收紧至 60 次/分钟，开发环境保持 100 次/分钟
 */
export const apiRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 分钟窗口
    max: config.nodeEnv === 'production' ? 60 : 100, // 生产环境收紧至 60 次/分钟
    store: createRedisStoreIfAvailable(),
    message: {
        code: 'RATE_LIMITED',
        message: 'API 请求过于频繁',
    },
    standardHeaders: true,
    legacyHeaders: false,
})
