import Redis from 'ioredis'
import { config } from './index.js'

/**
 * Redis 客户端单例
 * 用于 Token 黑名单、缓存等功能
 */
let redisClient: Redis | null = null

/**
 * 获取 Redis 客户端实例
 */
export function getRedis(): Redis {
    if (!redisClient) {
        redisClient = new Redis(config.redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 3) {
                    console.error('❌ Redis 连接失败，已达最大重试次数')
                    return null // 停止重试
                }
                return Math.min(times * 200, 2000) // 指数退避
            },
            lazyConnect: true, // 延迟连接，只在首次使用时连接
        })

        redisClient.on('error', (err) => {
            console.error('❌ Redis 错误:', err.message)
        })

        redisClient.on('connect', () => {
            console.log('✅ Redis 已连接')
        })
    }

    return redisClient
}

/**
 * 关闭 Redis 连接
 */
export async function closeRedis(): Promise<void> {
    if (redisClient) {
        await redisClient.quit()
        redisClient = null
        console.log('Redis 连接已关闭')
    }
}

/**
 * Token 黑名单服务
 */
export const tokenBlacklist = {
    /**
     * 将 Token 加入黑名单
     * @param token JWT Token
     * @param expiresIn Token 剩余有效期（秒）
     */
    async add(token: string, expiresIn: number): Promise<void> {
        const redis = getRedis()
        const key = `blacklist:${token}`
        // 设置 TTL 与 Token 过期时间一致，自动清理
        await redis.setex(key, expiresIn, '1')
    },

    /**
     * 检查 Token 是否在黑名单中
     * @param token JWT Token
     * @returns 是否在黑名单中
     */
    async isBlacklisted(token: string): Promise<boolean> {
        const redis = getRedis()
        const key = `blacklist:${token}`
        const result = await redis.get(key)
        return result !== null
    },
}

export default { getRedis, closeRedis, tokenBlacklist }
