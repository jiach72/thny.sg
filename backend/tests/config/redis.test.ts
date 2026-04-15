import { describe, it, expect, vi, beforeEach } from 'vitest'

// Must use vi.hoisted for anything used inside vi.mock factories
const mockRedisInstance = {
    on: vi.fn().mockReturnThis(),
    quit: vi.fn().mockResolvedValue('OK'),
    setex: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    call: vi.fn(),
}

const { RedisMock } = vi.hoisted(() => ({
    RedisMock: vi.fn().mockImplementation(() => mockRedisInstance),
}))

vi.mock('ioredis', () => ({
    default: RedisMock,
}))

vi.mock('../../src/config/index.js', () => ({
    config: { redisUrl: 'redis://localhost:6379' },
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import {
    createRedisClient,
    getRedis,
    closeRedis,
    tokenBlacklist,
    ssoTicketStore,
} from '../../src/config/redis.js'

describe('Redis Config', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createRedisClient', () => {
        it('应该创建 Redis 客户端实例', () => {
            const client = createRedisClient()
            expect(client).toBeDefined()
            expect(client.on).toHaveBeenCalledWith('error', expect.any(Function))
            expect(client.on).toHaveBeenCalledWith('connect', expect.any(Function))
        })

        it('应该配置延迟连接', () => {
            createRedisClient()
            expect(RedisMock).toHaveBeenCalledWith(
                'redis://localhost:6379',
                expect.objectContaining({ lazyConnect: true })
            )
        })
    })

    describe('getRedis', () => {
        it('应该返回单例客户端', () => {
            const client1 = getRedis()
            const client2 = getRedis()
            expect(client1).toBe(client2)
        })
    })

    describe('closeRedis', () => {
        it('应该关闭 Redis 连接并清理状态', async () => {
            getRedis()
            await closeRedis()
            expect(mockRedisInstance.quit).toHaveBeenCalled()
        })

        it('应该在无连接时不报错', async () => {
            await closeRedis()
            await closeRedis()
        })

        it('应该忽略关闭时的错误', async () => {
            getRedis()
            mockRedisInstance.quit.mockRejectedValueOnce(new Error('Connection already closed'))
            await closeRedis()
        })
    })

    describe('tokenBlacklist', () => {
        describe('add', () => {
            it('当 Redis 不可用时应降级到内存存储', async () => {
                await tokenBlacklist.add('test-token-99', 3600)
                expect(mockRedisInstance.setex).not.toHaveBeenCalled()
            })
        })

        describe('isBlacklisted', () => {
            it('不在黑名单中的 token 应返回 false', async () => {
                const result = await tokenBlacklist.isBlacklisted('nonexistent-token')
                expect(result).toBe(false)
            })

            it('内存中的未过期 token 应返回 true', async () => {
                await tokenBlacklist.add('mem-token-2', 3600)
                const result = await tokenBlacklist.isBlacklisted('mem-token-2')
                expect(result).toBe(true)
            })

            it('内存中的已过期 token 应返回 false', async () => {
                await tokenBlacklist.add('expired-token-2', 0)
                await new Promise(r => setTimeout(r, 10))
                const result = await tokenBlacklist.isBlacklisted('expired-token-2')
                expect(result).toBe(false)
            })
        })
    })

    describe('ssoTicketStore', () => {
        describe('create', () => {
            it('当 Redis 不可用时应降级到内存存储', async () => {
                await ssoTicketStore.create('ticket-10', 'user-10', 3600)
                expect(mockRedisInstance.setex).not.toHaveBeenCalled()
            })
        })

        describe('exchange', () => {
            it('内存中的未过期票据应返回 userId', async () => {
                await ssoTicketStore.create('ticket-20', 'user-20', 3600)
                const userId = await ssoTicketStore.exchange('ticket-20')
                expect(userId).toBe('user-20')
            })

            it('已交换的票据不应重复使用', async () => {
                await ssoTicketStore.create('ticket-30', 'user-30', 3600)
                await ssoTicketStore.exchange('ticket-30')
                const userId = await ssoTicketStore.exchange('ticket-30')
                expect(userId).toBeNull()
            })

            it('不存在的票据应返回 null', async () => {
                const userId = await ssoTicketStore.exchange('nonexistent')
                expect(userId).toBeNull()
            })
        })
    })
})
