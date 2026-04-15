import { NotFoundError } from '../middlewares/errorHandler.js'
import { prisma } from '../config/index.js'
import { Prisma } from '@prisma/client'
import type { Lead, Customer } from '@prisma/client'
import logger from '../config/logger.js'

interface CreateTemplateInput {
    name: string
    subject: string
    body: string
    category?: string
    description?: string
    variables?: string[]
}

interface UpdateTemplateInput {
    name?: string
    subject?: string
    body?: string
    category?: string
    description?: string
    variables?: string[]
    isActive?: boolean
}

interface SendEmailInput {
    templateId?: string
    recipient: string
    subject: string
    body: string
    leadId?: string
    customerId?: string
}

interface TemplateContext {
    lead?: Partial<Lead>
    customer?: Partial<Customer>
    custom?: Record<string, string>
}

export const emailTemplateService = {
    // ==================== 模板管理 ====================

    /**
     * 获取所有模板
     */
    async getTemplates(category?: string, includeInactive = false) {
        const where: Prisma.EmailTemplateWhereInput = {}

        if (category) {
            where.category = category
        }
        if (!includeInactive) {
            where.isActive = true
        }

        return prisma.emailTemplate.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                createdBy: {
                    select: { id: true, name: true }
                }
            }
        })
    },

    /**
     * 获取模板详情
     */
    async getTemplateById(id: string) {
        return prisma.emailTemplate.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: { id: true, name: true }
                }
            }
        })
    },

    /**
     * 创建模板
     */
    async createTemplate(data: CreateTemplateInput, creatorId?: string) {
        // 自动提取变量列表
        const extractedVars = this.extractVariables(data.subject + ' ' + data.body)
        const variables = data.variables || extractedVars

        return prisma.emailTemplate.create({
            data: {
                name: data.name,
                subject: data.subject,
                body: data.body,
                category: data.category || 'GENERAL',
                description: data.description,
                variables,
                createdById: creatorId
            }
        })
    },

    /**
     * 更新模板
     */
    async updateTemplate(id: string, data: UpdateTemplateInput) {
        const updateData: Prisma.EmailTemplateUpdateInput = { ...data }

        // 如果更新了内容，自动提取变量
        if (data.subject || data.body) {
            const template = await this.getTemplateById(id)
            if (template) {
                const content = (data.subject || template.subject) + ' ' + (data.body || template.body)
                updateData.variables = this.extractVariables(content)
            }
        }

        return prisma.emailTemplate.update({
            where: { id },
            data: updateData
        })
    },

    /**
     * 删除模板
     */
    async deleteTemplate(id: string) {
        return prisma.emailTemplate.delete({
            where: { id }
        })
    },

    // ==================== 变量处理 ====================

    /**
     * 从内容中提取变量
     */
    extractVariables(content: string): string[] {
        const regex = /\{\{(\w+)\}\}/g
        const matches = content.matchAll(regex)
        const vars = new Set<string>()

        for (const match of matches) {
            vars.add(`{{${match[1]}}}`)
        }

        return Array.from(vars)
    },

    /**
     * 替换变量
     */
    replaceVariables(content: string, context: TemplateContext): string {
        let result = content

        // 替换 Lead 相关变量
        if (context.lead) {
            const lead = context.lead
            result = result.replace(/\{\{lead\.(\w+)\}\}/g, (match, key) => {
                const value = lead[key as keyof typeof lead]
                return value != null ? String(value) : match
            })
            // 简化变量名
            result = result.replace(/\{\{name\}\}/g, lead.contactName || '{{name}}')
            result = result.replace(/\{\{company\}\}/g, lead.companyName || '{{company}}')
            result = result.replace(/\{\{email\}\}/g, lead.email || '{{email}}')
            result = result.replace(/\{\{phone\}\}/g, lead.phone || '{{phone}}')
        }

        // 替换 Customer 相关变量
        if (context.customer) {
            const customer = context.customer
            result = result.replace(/\{\{customer\.(\w+)\}\}/g, (match, key) => {
                const value = customer[key as keyof typeof customer]
                return value != null ? String(value) : match
            })
            result = result.replace(/\{\{name\}\}/g, customer.contactName || '{{name}}')
            result = result.replace(/\{\{company\}\}/g, customer.companyName || '{{company}}')
        }

        // 替换自定义变量
        if (context.custom) {
            for (const [key, value] of Object.entries(context.custom)) {
                result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
            }
        }

        return result
    },

    /**
     * 预览模板（替换变量后的结果）
     */
    async previewTemplate(templateId: string, context: TemplateContext) {
        const template = await this.getTemplateById(templateId)
        if (!template) {
            throw new NotFoundError('模板不存在')
        }

        return {
            subject: this.replaceVariables(template.subject, context),
            body: this.replaceVariables(template.body, context),
            originalTemplate: template
        }
    },

    // ==================== 邮件发送 ====================

    /**
     * 使用模板生成邮件内容
     */
    async generateEmail(templateId: string, recipient: string, context: TemplateContext) {
        const preview = await this.previewTemplate(templateId, context)

        return {
            recipient,
            subject: preview.subject,
            body: preview.body,
            templateId
        }
    },

    /**
     * 发送邮件（记录日志）
     */
    async sendEmail(input: SendEmailInput, senderId?: string): Promise<{ success: boolean; logId: string; messageId?: string; error?: string }> {
        // 动态导入邮件发送服务避免循环依赖
        const { emailSenderService } = await import('./emailSenderService.js')

        // 创建发送记录
        const log = await prisma.emailLog.create({
            data: {
                templateId: input.templateId,
                recipient: input.recipient,
                subject: input.subject,
                body: input.body,
                leadId: input.leadId,
                customerId: input.customerId,
                sentById: senderId,
                status: 'PENDING'
            }
        })

        // 调用实际邮件发送服务
        try {
            const result = await emailSenderService.send({
                to: input.recipient,
                subject: input.subject,
                html: input.body
            })

            if (result.success) {
                await prisma.emailLog.update({
                    where: { id: log.id },
                    data: {
                        status: 'SENT',
                        sentAt: new Date()
                    }
                })
                return { success: true, logId: log.id, messageId: result.messageId }
            } else {
                await prisma.emailLog.update({
                    where: { id: log.id },
                    data: {
                        status: 'FAILED',
                        errorMsg: result.error
                    }
                })
                return { success: false, logId: log.id, error: result.error }
            }
        } catch (error: unknown) {
            await prisma.emailLog.update({
                where: { id: log.id },
                data: {
                    status: 'FAILED',
                    errorMsg: error instanceof Error ? error.message : '发送失败'
                }
            })

            return { success: false, logId: log.id, error: error instanceof Error ? error.message : '发送失败' }
        }
    },

    /**
     * 使用模板发送邮件
     */
    async sendWithTemplate(
        templateId: string,
        recipient: string,
        context: TemplateContext,
        options?: { leadId?: string; customerId?: string },
        senderId?: string
    ) {
        const email = await this.generateEmail(templateId, recipient, context)

        return this.sendEmail({
            ...email,
            leadId: options?.leadId,
            customerId: options?.customerId
        }, senderId)
    },

    // ==================== 发送记录查询 ====================

    /**
     * 获取发送记录列表
     */
    async getEmailLogs(filters: {
        leadId?: string;
        customerId?: string;
        templateId?: string;
        status?: string;
    }, pagination: { page: number; limit: number }) {
        const { page, limit } = pagination
        const skip = (page - 1) * limit

        const where: Prisma.EmailLogWhereInput = {}
        if (filters.leadId) where.leadId = filters.leadId
        if (filters.customerId) where.customerId = filters.customerId
        if (filters.templateId) where.templateId = filters.templateId
        if (filters.status) where.status = filters.status

        const [logs, total] = await Promise.all([
            prisma.emailLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    template: { select: { id: true, name: true } },
                    sentBy: { select: { id: true, name: true } }
                }
            }),
            prisma.emailLog.count({ where })
        ])

        return {
            data: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    },

    // ==================== 预置模板种子数据 ====================

    /**
     * 初始化默认模板
     */
    async seedDefaultTemplates(): Promise<void> {
        const defaultTemplates: CreateTemplateInput[] = [
            {
                name: '初次联系 - 公司注册咨询',
                subject: '感谢您咨询同海 - 新加坡公司注册服务',
                body: `<p>尊敬的 {{name}}，</p>
<p>感谢您对同海控股新加坡公司注册服务的关注！</p>
<p>我是您的专属顾问，很高兴能够为您提供服务。根据您的需求，我们将为您提供：</p>
<ul>
  <li>新加坡公司注册全程代办</li>
  <li>公司秘书服务</li>
  <li>注册地址服务</li>
</ul>
<p>请问您方便告知以下信息吗？</p>
<ol>
  <li>预计注册公司的名称</li>
  <li>主要经营业务范围</li>
  <li>计划注册资本</li>
</ol>
<p>期待您的回复！</p>
<p>此致，<br/>同海控股团队</p>`,
                category: 'LEAD',
                description: '用于首次联系新客户时发送'
            },
            {
                name: '跟进邮件 - 提醒回复',
                subject: '{{name}}，继续跟进您的咨询',
                body: `<p>尊敬的 {{name}}，</p>
<p>之前与您沟通了关于 {{company}} 的注册事宜，想了解您是否有进一步的考虑？</p>
<p>如有任何疑问，欢迎随时与我联系。</p>
<p>祝商祺！<br/>同海控股团队</p>`,
                category: 'LEAD',
                description: '用于跟进未回复的潜在客户'
            },
            {
                name: '欢迎新客户',
                subject: '欢迎加入同海 - 您的客户账号已创建',
                body: `<p>尊敬的 {{name}}，</p>
<p>恭喜！您的同海客户账号已成功创建。</p>
<p>您可以通过以下链接设置您的登录密码：<br/>
<a href="{{setupUrl}}">点击设置密码</a></p>
<p>登录后，您可以：</p>
<ul>
  <li>查看项目进度</li>
  <li>下载相关文档</li>
  <li>与您的专属顾问沟通</li>
</ul>
<p>如有任何问题，请联系您的专属顾问。</p>
<p>此致，<br/>同海控股团队</p>`,
                category: 'CUSTOMER',
                description: '客户转化后发送的欢迎邮件'
            }
        ]

        const existingCount = await prisma.emailTemplate.count()
        if (existingCount > 0) {
            logger.info('邮件模板已存在，跳过初始化')
            return
        }

        for (const template of defaultTemplates) {
            await this.createTemplate(template)
        }

        logger.info(`已创建 ${defaultTemplates.length} 个默认邮件模板`)
    }
}

export default emailTemplateService
