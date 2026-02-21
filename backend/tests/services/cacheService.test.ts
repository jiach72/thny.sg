import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cacheService } from '../../src/services/cacheService.js'

// Mock getRedis
const mockRedis = {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    keys: vi.fn()
}

vi.mock('../../src/config/redis.js', () => ({
    getRedis: () => mockRedis
}))

// Mock logger
vi.mock('../../src/config/logger.js', () => ({
    default: {
        error: vi.fn(),
        info: vi.fn()
    }
}))

describe('cacheService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('get', () => {
        it('should return parsed JSON data when key exists', async () => {
            mockRedis.get.mockResolvedValueOnce(JSON.stringify({ foo: 'bar' }))
            const result = await cacheService.get('test_key')
            expect(mockRedis.get).toHaveBeenCalledWith('cache:test_key')
            expect(result).toEqual({ foo: 'bar' })
        })

        it('should return null when key does not exist', async () => {
            mockRedis.get.mockResolvedValueOnce(null)
            const result = await cacheService.get('test_key2')
            expect(result).toBeNull()
        })

        it('should return null and log error when redis fails', async () => {
            mockRedis.get.mockRejectedValueOnce(new Error('Redis is down'))
            const result = await cacheService.get('test_key3')
            expect(result).toBeNull()
        })
    })

    describe('set', () => {
        it('should call redis setup API with serialized JSON', async () => {
            await cacheService.set('user:1', { name: 'admin' }, 60)
            expect(mockRedis.setex).toHaveBeenCalledWith('cache:user:1', 60, JSON.stringify({ name: 'admin' }))
        })
    })

    describe('del', () => {
        it('should call redis del API', async () => {
            await cacheService.del('some_key')
            expect(mockRedis.del).toHaveBeenCalledWith('cache:some_key')
        })
    })

    describe('invalidatePattern', () => {
        it('should find keys by pattern and delete them', async () => {
            mockRedis.keys.mockResolvedValueOnce(['cache:dash:1', 'cache:dash:2'])
            mockRedis.del.mockResolvedValueOnce(2)

            const deleted = await cacheService.invalidatePattern('dash:*')

            expect(mockRedis.keys).toHaveBeenCalledWith('cache:dash:*')
            expect(mockRedis.del).toHaveBeenCalledWith('cache:dash:1', 'cache:dash:2')
            expect(deleted).toBe(2)
        })

        it('should return 0 when no keys match the pattern', async () => {
            mockRedis.keys.mockResolvedValueOnce([])
            const deleted = await cacheService.invalidatePattern('dash:*')
            expect(deleted).toBe(0)
            expect(mockRedis.del).not.toHaveBeenCalled()
        })
    })

    describe('getOrSet', () => {
        it('should return cached value if present', async () => {
            mockRedis.get.mockResolvedValueOnce(JSON.stringify('cached_value'))
            const factory = vi.fn()

            const result = await cacheService.getOrSet('config', factory)

            expect(result).toBe('cached_value')
            expect(factory).not.toHaveBeenCalled()
        })

        it('should call factory and cache its result if missing', async () => {
            mockRedis.get.mockResolvedValueOnce(null)
            const factory = vi.fn().mockResolvedValue('fresh_value')

            const result = await cacheService.getOrSet('config', factory, 10)

            expect(result).toBe('fresh_value')
            expect(factory).toHaveBeenCalled()
            expect(mockRedis.setex).toHaveBeenCalledWith('cache:config', 10, JSON.stringify('fresh_value'))
        })
    })
})
