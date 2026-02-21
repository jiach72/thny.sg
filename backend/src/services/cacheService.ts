import { getRedis } from '../config/redis.js'
import logger from '../config/logger.js'

/**
 * Redis 缓存服务
 * 提供通用的缓存 get/set/del 操作
 */
export const cacheService = {
    /** 缓存键前缀 */
    PREFIX: 'cache:',

    /**
     * 获取缓存值
     * @returns 解析后的 JSON 对象，或 null
     */
    async get<T = unknown>(key: string): Promise<T | null> {
        try {
            const redis = getRedis()
            const data = await redis.get(this.PREFIX + key)
            if (!data) return null
            return JSON.parse(data) as T
        } catch (error) {
            logger.error('缓存读取失败', {
                key,
                error: error instanceof Error ? error.message : '未知错误',
                context: 'cacheService',
            })
            return null
        }
    },

    /**
     * 设置缓存值
     * @param key 缓存键
     * @param value 要缓存的值（自动 JSON 序列化）
     * @param ttlSeconds 过期时间（秒），默认 300 秒（5 分钟）
     */
    async set(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
        try {
            const redis = getRedis()
            const data = JSON.stringify(value)
            await redis.setex(this.PREFIX + key, ttlSeconds, data)
        } catch (error) {
            logger.error('缓存写入失败', {
                key,
                error: error instanceof Error ? error.message : '未知错误',
                context: 'cacheService',
            })
        }
    },

    /**
     * 删除缓存
     */
    async del(key: string): Promise<void> {
        try {
            const redis = getRedis()
            await redis.del(this.PREFIX + key)
        } catch (error) {
            logger.error('缓存删除失败', {
                key,
                error: error instanceof Error ? error.message : '未知错误',
                context: 'cacheService',
            })
        }
    },

    /**
     * 按前缀批量失效缓存
     * @param pattern 匹配模式，如 'dashboard:*'
     */
    async invalidatePattern(pattern: string): Promise<number> {
        try {
            const redis = getRedis()
            const keys = await redis.keys(this.PREFIX + pattern)
            if (keys.length === 0) return 0

            const deleted = await redis.del(...keys)
            logger.info('批量失效缓存', { pattern, count: deleted, context: 'cacheService' })
            return deleted
        } catch (error) {
            logger.error('批量失效缓存失败', {
                pattern,
                error: error instanceof Error ? error.message : '未知错误',
                context: 'cacheService',
            })
            return 0
        }
    },

    /**
     * 获取或设置（缓存穿透保护）
     * 如果缓存存在，直接返回；否则执行 factory 获取数据并缓存
     */
    async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds: number = 300): Promise<T> {
        const cached = await this.get<T>(key)
        if (cached !== null) return cached

        const value = await factory()
        await this.set(key, value, ttlSeconds)
        return value
    },

    // ==================== 业务缓存便捷方法 ====================

    /**
     * 缓存 Dashboard 统计数据
     */
    async cacheDashboardStats(key: string, factory: () => Promise<unknown>): Promise<unknown> {
        return this.getOrSet(`dashboard:${key}`, factory, 300) // 5 分钟
    },

    /**
     * 失效 Dashboard 缓存
     */
    async invalidateDashboard(): Promise<void> {
        await this.invalidatePattern('dashboard:*')
    },

    /**
     * 缓存用户权限
     */
    async cacheUserPermissions(userId: string, factory: () => Promise<unknown>): Promise<unknown> {
        return this.getOrSet(`permissions:${userId}`, factory, 600) // 10 分钟
    },

    /**
     * 失效用户权限缓存
     */
    async invalidateUserPermissions(userId: string): Promise<void> {
        await this.del(`permissions:${userId}`)
    },

    /**
     * 失效所有权限缓存
     */
    async invalidateAllPermissions(): Promise<void> {
        await this.invalidatePattern('permissions:*')
    },
}

export default cacheService
