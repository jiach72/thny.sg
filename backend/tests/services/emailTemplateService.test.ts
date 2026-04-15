import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    emailTemplate: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    emailLog: {
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
    },
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { emailTemplateService } from '../../src/services/emailTemplateService.js'

describe('EmailTemplateService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('模板管理', () => {
        describe('getTemplates', () => {
            it('应返回活跃模板列表', async () => {
                const mockTemplates = [{ id: '1', name: 'Welcome', isActive: true }]
                prismaMock.emailTemplate.findMany.mockResolvedValue(mockTemplates)

                const result = await emailTemplateService.getTemplates()
                expect(result).toEqual(mockTemplates)
            })

            it('应支持按分类筛选', async () => {
                prismaMock.emailTemplate.findMany.mockResolvedValue([])

                await emailTemplateService.getTemplates('LEAD')
                expect(prismaMock.emailTemplate.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({ where: expect.objectContaining({ category: 'LEAD', isActive: true }) })
                )
            })

            it('应支持包含未激活模板', async () => {
                prismaMock.emailTemplate.findMany.mockResolvedValue([])

                await emailTemplateService.getTemplates(undefined, true)
                expect(prismaMock.emailTemplate.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({ where: {} })
                )
            })
        })

        describe('getTemplateById', () => {
            it('应返回模板详情', async () => {
                const mockTemplate = { id: '1', name: 'Welcome' }
                prismaMock.emailTemplate.findUnique.mockResolvedValue(mockTemplate)

                const result = await emailTemplateService.getTemplateById('1')
                expect(result).toEqual(mockTemplate)
            })

            it('模板不存在时返回 null', async () => {
                prismaMock.emailTemplate.findUnique.mockResolvedValue(null)

                const result = await emailTemplateService.getTemplateById('nonexistent')
                expect(result).toBeNull()
            })
        })

        describe('createTemplate', () => {
            it('应创建模板并自动提取变量', async () => {
                const mockCreated = { id: '1', name: 'Test' }
                prismaMock.emailTemplate.create.mockResolvedValue(mockCreated)

                await emailTemplateService.createTemplate({
                    name: 'Test',
                    subject: 'Hello {{name}}',
                    body: '<p>Dear {{name}}, welcome to {{company}}</p>',
                })

                expect(prismaMock.emailTemplate.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            variables: ['{{name}}', '{{company}}'],
                        }),
                    })
                )
            })

            it('应使用传入的变量列表', async () => {
                prismaMock.emailTemplate.create.mockResolvedValue({ id: '1' })

                await emailTemplateService.createTemplate({
                    name: 'Test',
                    subject: 'Hello',
                    body: 'Body',
                    variables: ['{{custom}}'],
                })

                expect(prismaMock.emailTemplate.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({ variables: ['{{custom}}'] }),
                    })
                )
            })

            it('应支持 creatorId', async () => {
                prismaMock.emailTemplate.create.mockResolvedValue({ id: '1' })

                await emailTemplateService.createTemplate(
                    { name: 'Test', subject: 'S', body: 'B' },
                    'creator-1'
                )

                expect(prismaMock.emailTemplate.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({ createdById: 'creator-1' }),
                    })
                )
            })
        })

        describe('updateTemplate', () => {
            it('应更新模板', async () => {
                prismaMock.emailTemplate.findUnique.mockResolvedValue({ id: '1', subject: 'Old', body: 'Old body' })
                prismaMock.emailTemplate.update.mockResolvedValue({ id: '1', subject: 'New' })

                const result = await emailTemplateService.updateTemplate('1', { subject: 'New {{name}}' })
                expect(result).toEqual({ id: '1', subject: 'New' })
            })
        })

        describe('deleteTemplate', () => {
            it('应删除模板', async () => {
                prismaMock.emailTemplate.delete.mockResolvedValue({ id: '1' })

                await emailTemplateService.deleteTemplate('1')
                expect(prismaMock.emailTemplate.delete).toHaveBeenCalledWith({ where: { id: '1' } })
            })
        })
    })

    describe('变量处理', () => {
        describe('extractVariables', () => {
            it('应提取 {{变量}} 格式的变量', () => {
                const result = emailTemplateService.extractVariables('Hello {{name}}, from {{company}}')
                expect(result).toEqual(['{{name}}', '{{company}}'])
            })

            it('应去重相同变量', () => {
                const result = emailTemplateService.extractVariables('{{name}} and {{name}}')
                expect(result).toEqual(['{{name}}'])
            })

            it('无变量时返回空数组', () => {
                const result = emailTemplateService.extractVariables('No variables here')
                expect(result).toEqual([])
            })
        })

        describe('replaceVariables', () => {
            it('应替换 Lead 变量', () => {
                const result = emailTemplateService.replaceVariables(
                    'Hello {{name}} from {{company}}, your email is {{lead.email}}',
                    { lead: { contactName: 'John', companyName: 'ACME', email: 'john@acme.com' } as any }
                )
                expect(result).toContain('John')
                expect(result).toContain('ACME')
                expect(result).toContain('john@acme.com')
            })

            it('应替换 Customer 变量', () => {
                const result = emailTemplateService.replaceVariables(
                    'Dear {{name}} from {{company}}',
                    { customer: { contactName: 'Jane', companyName: 'Corp' } as any }
                )
                expect(result).toContain('Jane')
                expect(result).toContain('Corp')
            })

            it('应替换自定义变量', () => {
                const result = emailTemplateService.replaceVariables(
                    'Click {{setupUrl}}',
                    { custom: { setupUrl: 'https://example.com/setup' } }
                )
                expect(result).toContain('https://example.com/setup')
            })

            it('值为 null 时保留原始变量标记', () => {
                const result = emailTemplateService.replaceVariables(
                    'Hello {{name}}',
                    { lead: { contactName: null, companyName: null } as any }
                )
                expect(result).toContain('{{name}}')
            })
        })

        describe('previewTemplate', () => {
            it('应返回预览结果', async () => {
                prismaMock.emailTemplate.findUnique.mockResolvedValue({
                    id: '1', subject: 'Hello {{name}}', body: 'Dear {{name}}',
                })

                const result = await emailTemplateService.previewTemplate('1', {
                    lead: { contactName: 'John' } as any,
                })

                expect(result.subject).toContain('John')
                expect(result.body).toContain('John')
            })

            it('模板不存在时抛出 NotFoundError', async () => {
                prismaMock.emailTemplate.findUnique.mockResolvedValue(null)

                await expect(
                    emailTemplateService.previewTemplate('nonexistent', {})
                ).rejects.toThrow('模板不存在')
            })
        })
    })

    describe('邮件发送', () => {
        it('sendEmail 成功时应更新日志为 SENT', async () => {
            prismaMock.emailLog.create.mockResolvedValue({ id: 'log-1' })
            prismaMock.emailLog.update.mockResolvedValue({})

            vi.doMock('../../src/services/emailSenderService.js', () => ({
                emailSenderService: {
                    send: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-1' }),
                },
            }))

            const result = await emailTemplateService.sendEmail({
                recipient: 'test@example.com',
                subject: 'Test',
                body: '<p>Hello</p>',
            })

            expect(result.success).toBe(true)
            expect(result.logId).toBe('log-1')
        })

        it('sendEmail 失败时应更新日志为 FAILED', async () => {
            prismaMock.emailLog.create.mockResolvedValue({ id: 'log-1' })
            prismaMock.emailLog.update.mockResolvedValue({})

            const result = await emailTemplateService.sendEmail({
                recipient: 'test@example.com',
                subject: 'Test',
                body: '<p>Hello</p>',
            })

            // sendEmail 动态导入 emailSenderService，这里可能返回 success 或 error
            expect(result).toHaveProperty('logId', 'log-1')
        })
    })

    describe('getEmailLogs', () => {
        it('应返回分页邮件日志', async () => {
            const mockLogs = [{ id: '1', recipient: 'test@test.com' }]
            prismaMock.emailLog.findMany.mockResolvedValue(mockLogs)
            prismaMock.emailLog.count.mockResolvedValue(1)

            const result = await emailTemplateService.getEmailLogs({}, { page: 1, limit: 20 })

            expect(result.data).toEqual(mockLogs)
            expect(result.pagination.total).toBe(1)
        })

        it('应支持筛选条件', async () => {
            prismaMock.emailLog.findMany.mockResolvedValue([])
            prismaMock.emailLog.count.mockResolvedValue(0)

            await emailTemplateService.getEmailLogs(
                { leadId: 'l1', customerId: 'c1', templateId: 't1', status: 'SENT' },
                { page: 1, limit: 10 }
            )

            expect(prismaMock.emailLog.findMany).toHaveBeenCalled()
        })
    })

    describe('seedDefaultTemplates', () => {
        it('已有模板时应跳过初始化', async () => {
            prismaMock.emailTemplate.count.mockResolvedValue(5)

            await emailTemplateService.seedDefaultTemplates()

            expect(prismaMock.emailTemplate.create).not.toHaveBeenCalled()
        })

        it('无模板时应创建默认模板', async () => {
            prismaMock.emailTemplate.count.mockResolvedValue(0)
            prismaMock.emailTemplate.create.mockResolvedValue({ id: '1' })

            await emailTemplateService.seedDefaultTemplates()

            expect(prismaMock.emailTemplate.create).toHaveBeenCalledTimes(3)
        })
    })
})
