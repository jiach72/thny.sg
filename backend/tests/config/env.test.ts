import { describe, it, expect } from 'vitest'
import { config } from '../../src/config/index.js'

describe('Environment Configuration', () => {
    it('should have port configured', () => {
        expect(config.port).toBeDefined()
        expect(typeof config.port).toBe('number')
    })

    it('should have nodeEnv configured', () => {
        expect(config.nodeEnv).toBeDefined()
        expect(['development', 'production', 'test']).toContain(config.nodeEnv)
    })

    it('should have jwt config', () => {
        expect(config.jwt).toBeDefined()
        expect(config.jwt.secret).toBeDefined()
        expect(typeof config.jwt.secret).toBe('string')
        expect(config.jwt.expiresIn).toBeDefined()
        expect(config.jwt.refreshExpiresIn).toBeDefined()
    })

    it('should have database config', () => {
        expect(config.databaseUrl).toBeDefined()
        expect(typeof config.databaseUrl).toBe('string')
    })

    it('should have redis config', () => {
        expect(config.redisUrl).toBeDefined()
        expect(typeof config.redisUrl).toBe('string')
    })

    it('should have cors config', () => {
        expect(config.cors).toBeDefined()
        expect(Array.isArray(config.cors.origins)).toBe(true)
    })

    it('should have upload config', () => {
        expect(config.upload).toBeDefined()
        expect(config.upload.dir).toBeDefined()
        expect(config.upload.maxSize).toBeDefined()
        expect(typeof config.upload.maxSize).toBe('number')
    })

    it('should have frontend URLs configured', () => {
        expect(config.frontendUrl).toBeDefined()
        expect(config.managementUrl).toBeDefined()
        expect(config.portalUrl).toBeDefined()
    })
})
