import { describe, it, expect, vi } from 'vitest'

vi.mock('../../src/config/redis.js', () => ({
    getRedis: vi.fn(),
    isRedisConnected: false,
}))

vi.mock('../../src/config/env.js', () => ({
    config: {
        nodeEnv: 'test',
        jwt: { secret: 'test-secret' },
    },
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('Rate Limiter Configuration', () => {
    it('should export authRateLimiter', async () => {
        const { authRateLimiter } = await import('../../src/middlewares/rateLimiter.js')
        expect(authRateLimiter).toBeDefined()
        expect(typeof authRateLimiter).toBe('function')
    })

    it('should export refreshRateLimiter', async () => {
        const { refreshRateLimiter } = await import('../../src/middlewares/rateLimiter.js')
        expect(refreshRateLimiter).toBeDefined()
        expect(typeof refreshRateLimiter).toBe('function')
    })

    it('should export apiRateLimiter', async () => {
        const { apiRateLimiter } = await import('../../src/middlewares/rateLimiter.js')
        expect(apiRateLimiter).toBeDefined()
        expect(typeof apiRateLimiter).toBe('function')
    })

    it('authRateLimiter should be a valid express middleware', async () => {
        const { authRateLimiter } = await import('../../src/middlewares/rateLimiter.js')
        expect(authRateLimiter.length).toBe(3)
    })

    it('apiRateLimiter should be a valid express middleware', async () => {
        const { apiRateLimiter } = await import('../../src/middlewares/rateLimiter.js')
        expect(apiRateLimiter.length).toBe(3)
    })

    it('refreshRateLimiter should be a valid express middleware', async () => {
        const { refreshRateLimiter } = await import('../../src/middlewares/rateLimiter.js')
        expect(refreshRateLimiter.length).toBe(3)
    })
})
