import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    systemSetting: {
        findUnique: vi.fn(),
    },
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

// Mock nodemailer 防止实际 SMTP 连接
vi.mock('nodemailer', () => ({
    default: {
        createTransport: vi.fn().mockReturnValue({
            sendMail: vi.fn().mockResolvedValue({ messageId: 'mock-msg-id' }),
            verify: vi.fn().mockResolvedValue(true),
        }),
    },
}))

import { emailSenderService } from '../../src/services/emailSenderService'

describe('EmailSenderService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('initialize', () => {
        it('should initialize with console provider when no settings found', async () => {
            prismaMock.systemSetting.findUnique.mockResolvedValue(null)

            await emailSenderService.initialize()

            const status = emailSenderService.getStatus()
            expect(status.provider).toBe('CONSOLE')
            expect(status.configured).toBe(true)
        })

        it('should initialize with SMTP when all SMTP settings are present', async () => {
            prismaMock.systemSetting.findUnique.mockImplementation((args: { where: { key: string } }) => {
                const configMap: Record<string, string> = {
                    EMAIL_PROVIDER: 'SMTP',
                    SMTP_HOST: 'smtp.example.com',
                    SMTP_PORT: '587',
                    SMTP_USER: 'user@example.com',
                    SMTP_PASS: 'password123',
                    EMAIL_FROM: 'noreply@example.com',
                }
                const value = configMap[args.where.key] || null
                return Promise.resolve(value ? { value } : null)
            })

            await emailSenderService.initialize()

            const status = emailSenderService.getStatus()
            expect(status.provider).toBe('SMTP')
            expect(status.configured).toBe(true)
        })

        it('should fallback gracefully on initialization error', async () => {
            prismaMock.systemSetting.findUnique.mockRejectedValue(new Error('DB error'))

            await emailSenderService.initialize()
        })
    })

    describe('send via console', () => {
        it('should send email in console mode', async () => {
            prismaMock.systemSetting.findUnique.mockResolvedValue(null)
            await emailSenderService.initialize()

            const result = await emailSenderService.sendViaConsole({
                to: 'test@example.com',
                from: 'noreply@thny.sg',
                subject: '测试邮件',
                html: '<h1>Hello</h1>',
            })

            expect(result.success).toBe(true)
            expect(result.messageId).toContain('console-')
        })
    })

    describe('sendViaSMTP', () => {
        it('should send email via SMTP when configured', async () => {
            prismaMock.systemSetting.findUnique.mockImplementation((args: { where: { key: string } }) => {
                const configMap: Record<string, string> = {
                    EMAIL_PROVIDER: 'SMTP',
                    SMTP_HOST: 'smtp.example.com',
                    SMTP_PORT: '587',
                    SMTP_USER: 'user@example.com',
                    SMTP_PASS: 'password123',
                    EMAIL_FROM: 'noreply@example.com',
                }
                const value = configMap[args.where.key] || null
                return Promise.resolve(value ? { value } : null)
            })
            await emailSenderService.initialize()

            const result = await emailSenderService.sendViaSMTP({
                to: 'test@example.com',
                from: 'noreply@example.com',
                subject: '测试',
                html: '<p>测试</p>',
            })

            expect(result.success).toBe(true)
            expect(result.messageId).toBe('mock-msg-id')
        })
    })

    describe('testConnection', () => {
        it('should return success for SMTP connection test', async () => {
            prismaMock.systemSetting.findUnique.mockImplementation((args: { where: { key: string } }) => {
                const configMap: Record<string, string> = {
                    EMAIL_PROVIDER: 'SMTP',
                    SMTP_HOST: 'smtp.example.com',
                    SMTP_PORT: '587',
                    SMTP_USER: 'user@example.com',
                    SMTP_PASS: 'password123',
                    EMAIL_FROM: 'noreply@example.com',
                }
                const value = configMap[args.where.key] || null
                return Promise.resolve(value ? { value } : null)
            })
            await emailSenderService.initialize()

            const result = await emailSenderService.testConnection()

            expect(result.success).toBe(true)
            expect(result.message).toContain('SMTP')
        })
    })

    describe('getStatus', () => {
        it('should return a valid status object', () => {
            const status = emailSenderService.getStatus()

            expect(status).toHaveProperty('provider')
            expect(status).toHaveProperty('configured')
            expect(typeof status.provider).toBe('string')
            expect(typeof status.configured).toBe('boolean')
        })
    })
})
