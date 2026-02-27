import Redis from 'ioredis'
import { config } from './index.js'

/**
 * Redis 客户端单例
 * 用于 Token 黑名单、缓存等功能
 */
let redisClient: Redis | null = null

// 用于记录连接状态，当 Redis 断开时自动启用本地拦截
export let isRedisConnected = false
const memoryBlacklist = new Map<string, number>()

/**
 * 创建一个新的 Redis 客户端实例
 */
export function createRedisClient(): Redis {
    const client = new Redis(config.redisUrl, {
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

    client.on('error', (err) => {
        console.error('❌ Redis 错误:', err.message)
    })

    client.on('connect', () => {
        console.log('✅ Redis 独立客户端已连接')
    })

    return client
}

/**
 * 获取 Redis 全局单例
 */
export function getRedis(): Redis {
    if (!redisClient) {
        redisClient = createRedisClient()

        // 绑定单例特有的状态管理
        redisClient.on('error', () => {
            isRedisConnected = false
        })

        redisClient.on('connect', () => {
            isRedisConnected = true
        })

        redisClient.on('close', () => {
            if (isRedisConnected) {
                console.log('⚠️ Redis 全局连接挂断，进入降级容错模式')
            }
            isRedisConnected = false
        })
    }

    return redisClient
}

/**
 * 关闭 Redis 连接
 */
export async function closeRedis(): Promise<void> {
    if (redisClient) {
        try {
            await redisClient.quit()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            console.warn('⚠️ 忽略关闭 Redis 时的潜在错误:', message)
        } finally {
            redisClient = null
            isRedisConnected = false
            console.log('Redis 连接已清理')
        }
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
        try {
            if (isRedisConnected) {
                const redis = getRedis()
                const key = `blacklist:${token}`
                await redis.setex(key, expiresIn, '1')
            } else {
                throw new Error('Redis is not connected')
            }
        } catch (error) {
            // 降级：存入本地内存
            const expireAt = Date.now() + expiresIn * 1000
            memoryBlacklist.set(token, expireAt)

            // 简单清理过期本地 token
            for (const [k, v] of memoryBlacklist.entries()) {
                if (Date.now() > v) {
                    memoryBlacklist.delete(k)
                }
            }
        }
    },

    /**
     * 检查 Token 是否在黑名单中
     * @param token JWT Token
     * @returns 是否在黑名单中
     */
    async isBlacklisted(token: string): Promise<boolean> {
        // 先检查本地，若匹配且未过期直接返回（极速降级拦截）
        const memExpire = memoryBlacklist.get(token)
        if (memExpire) {
            if (Date.now() < memExpire) return true
            memoryBlacklist.delete(token)
        }

        try {
            if (isRedisConnected) {
                const redis = getRedis()
                const key = `blacklist:${token}`
                const result = await redis.get(key)
                return result !== null
            }
        } catch (error) {
            // 降级模式：当 Redis 有异常时只依赖刚才的本地内存拦截器
            // 虽然这里可能有 Redis 断开前加入的 token 被拦截不到，但在兜底容灾中可接受，或返回 false 使 JWT 继续存活
        }

        return false
    },
}

export default { getRedis, closeRedis, tokenBlacklist, isRedisConnected }
