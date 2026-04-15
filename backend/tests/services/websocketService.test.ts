import { describe, it, expect, vi, beforeEach } from 'vitest'

// 对于 websocketService，由于它依赖 socket.io 和大量基础设施，
// 我们测试可独立测试的纯函数和辅助方法

vi.mock('../../src/config/index.js', () => ({
    config: {
        cors: { origins: ['http://localhost:3000'] },
        jwt: { secret: 'test-secret' },
        redisUrl: '',
    },
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

vi.mock('../../src/config/redis.js', () => ({
    createRedisClient: vi.fn(),
    isRedisConnected: false,
}))

vi.mock('jsonwebtoken', () => ({
    default: { verify: vi.fn() },
}))

import {
    isUserOnline,
    getOnlineCount,
    notifyUser,
    notifyUsers,
    broadcast,
} from '../../src/services/websocketService.js'

describe('WebSocketService', () => {
    describe('isUserOnline', () => {
        it('未初始化时用户不在线', () => {
            expect(isUserOnline('u1')).toBe(false)
        })
    })

    describe('getOnlineCount', () => {
        it('未初始化时在线数为0', () => {
            expect(getOnlineCount()).toBe(0)
        })
    })

    describe('notifyUser', () => {
        it('未初始化时调用不报错', () => {
            expect(() => notifyUser('u1', 'event', {})).not.toThrow()
        })
    })

    describe('notifyUsers', () => {
        it('未初始化时调用不报错', () => {
            expect(() => notifyUsers(['u1', 'u2'], 'event', {})).not.toThrow()
        })
    })

    describe('broadcast', () => {
        it('未初始化时调用不报错', () => {
            expect(() => broadcast('event', {})).not.toThrow()
        })
    })
})
