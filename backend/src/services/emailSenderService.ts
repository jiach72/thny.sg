import { prisma } from '../config/index.js'
import nodemailer from 'nodemailer'

interface EmailOptions {
    to: string | string[]
    subject: string
    html: string
    text?: string
    from?: string
    replyTo?: string
    attachments?: Array<{
        filename: string
        content: Buffer | string
        contentType?: string
    }>
}

interface EmailResult {
    success: boolean
    messageId?: string
    error?: string
}

type EmailProvider = 'SMTP' | 'SENDGRID' | 'AWS_SES' | 'CONSOLE'

interface EmailConfig {
    provider: EmailProvider
    smtp?: {
        host: string
        port: number
        secure: boolean
        auth: {
            user: string
            pass: string
        }
    }
    sendgrid?: {
        apiKey: string
    }
    awsSes?: {
        region: string
        accessKeyId: string
        secretAccessKey: string
    }
    defaultFrom: string
}

// 默认配置（开发环境使用控制台输出）
const emailConfig: EmailConfig = {
    provider: 'CONSOLE',
    defaultFrom: 'noreply@tonghai.sg'
}

export const emailSenderService = {
    /**
     * 初始化邮件配置
     */
    async initialize(): Promise<void> {
        try {
            // 从系统设置加载配置
            const [provider, smtpHost, smtpPort, smtpUser, smtpPass, defaultFrom] = await Promise.all([
                prisma.systemSetting.findUnique({ where: { key: 'EMAIL_PROVIDER' } }),
                prisma.systemSetting.findUnique({ where: { key: 'SMTP_HOST' } }),
                prisma.systemSetting.findUnique({ where: { key: 'SMTP_PORT' } }),
                prisma.systemSetting.findUnique({ where: { key: 'SMTP_USER' } }),
                prisma.systemSetting.findUnique({ where: { key: 'SMTP_PASS' } }),
                prisma.systemSetting.findUnique({ where: { key: 'EMAIL_FROM' } }),
            ])

            if (provider?.value) {
                emailConfig.provider = provider.value as EmailProvider
            }

            if (defaultFrom?.value) {
                emailConfig.defaultFrom = defaultFrom.value
            }

            if (smtpHost?.value && smtpUser?.value && smtpPass?.value) {
                emailConfig.smtp = {
                    host: smtpHost.value,
                    port: parseInt(smtpPort?.value || '587'),
                    secure: (smtpPort?.value || '587') === '465',
                    auth: {
                        user: smtpUser.value,
                        pass: smtpPass.value
                    }
                }
            }

            console.log(`📧 邮件服务已初始化，提供商: ${emailConfig.provider}`)
        } catch (error) {
            console.warn('⚠️ 邮件配置加载失败，使用控制台模式')
        }
    },

    /**
     * 发送邮件
     */
    async send(options: EmailOptions): Promise<EmailResult> {
        const from = options.from || emailConfig.defaultFrom

        switch (emailConfig.provider) {
            case 'SMTP':
                return this.sendViaSMTP({ ...options, from })

            case 'SENDGRID':
                return this.sendViaSendGrid({ ...options, from })

            case 'AWS_SES':
                return this.sendViaAwsSes({ ...options, from })

            case 'CONSOLE':
            default:
                return this.sendViaConsole({ ...options, from })
        }
    },

    /**
     * 通过 SMTP 发送
     */
    async sendViaSMTP(options: EmailOptions & { from: string }): Promise<EmailResult> {
        if (!emailConfig.smtp) {
            return { success: false, error: 'SMTP 配置缺失' }
        }

        try {
            const transporter = nodemailer.createTransport({
                host: emailConfig.smtp.host,
                port: emailConfig.smtp.port,
                secure: emailConfig.smtp.secure,
                auth: emailConfig.smtp.auth
            })

            const result = await transporter.sendMail({
                from: options.from,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
                replyTo: options.replyTo,
                attachments: options.attachments
            })

            return {
                success: true,
                messageId: result.messageId
            }
        } catch (error: any) {
            console.error('SMTP 发送失败:', error)
            return {
                success: false,
                error: error.message
            }
        }
    },

    /**
     * 通过 SendGrid 发送
     */
    async sendViaSendGrid(options: EmailOptions & { from: string }): Promise<EmailResult> {
        if (!emailConfig.sendgrid?.apiKey) {
            return { success: false, error: 'SendGrid API Key 缺失' }
        }

        try {
            // 动态导入 SendGrid（可选依赖）
            // @ts-ignore - 可选依赖，运行时才加载
            const sgMail = await import('@sendgrid/mail')
            sgMail.default.setApiKey(emailConfig.sendgrid.apiKey)

            const msg = {
                to: options.to,
                from: options.from,
                subject: options.subject,
                html: options.html,
                text: options.text || options.html.replace(/<[^>]*>/g, '')
            }

            const [response] = await (sgMail.default as any).send(msg)

            return {
                success: true,
                messageId: (response as any).headers?.['x-message-id'] || `sg-${Date.now()}`
            }
        } catch (error: any) {
            console.error('SendGrid 发送失败:', error)
            return {
                success: false,
                error: error.message
            }
        }
    },

    /**
     * 通过 AWS SES 发送
     */
    async sendViaAwsSes(options: EmailOptions & { from: string }): Promise<EmailResult> {
        if (!emailConfig.awsSes) {
            return { success: false, error: 'AWS SES 配置缺失' }
        }

        try {
            // 动态导入 AWS SDK（可选依赖）
            // @ts-ignore - 可选依赖，运行时才加载
            const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses')

            const client = new SESClient({
                region: emailConfig.awsSes.region,
                credentials: {
                    accessKeyId: emailConfig.awsSes.accessKeyId,
                    secretAccessKey: emailConfig.awsSes.secretAccessKey
                }
            })

            const toAddresses = Array.isArray(options.to) ? options.to : [options.to]

            const command = new SendEmailCommand({
                Source: options.from,
                Destination: {
                    ToAddresses: toAddresses
                },
                Message: {
                    Subject: { Data: options.subject },
                    Body: {
                        Html: { Data: options.html },
                        Text: { Data: options.text || options.html.replace(/<[^>]*>/g, '') }
                    }
                }
            })

            const response = await client.send(command)

            return {
                success: true,
                messageId: response.MessageId
            }
        } catch (error: any) {
            console.error('AWS SES 发送失败:', error)
            return {
                success: false,
                error: error.message
            }
        }
    },

    /**
     * 控制台输出（开发模式）
     */
    async sendViaConsole(options: EmailOptions & { from: string }): Promise<EmailResult> {
        console.log('\n' + '='.repeat(60))
        console.log('📧 [开发模式] 邮件发送模拟')
        console.log('='.repeat(60))
        console.log(`From:    ${options.from}`)
        console.log(`To:      ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`)
        console.log(`Subject: ${options.subject}`)
        console.log('-'.repeat(60))
        console.log('Body (HTML):')
        console.log(options.html.substring(0, 500) + (options.html.length > 500 ? '...' : ''))
        console.log('='.repeat(60) + '\n')

        return {
            success: true,
            messageId: `console-${Date.now()}`
        }
    },

    /**
     * 测试邮件连接
     */
    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            if (emailConfig.provider === 'CONSOLE') {
                return { success: true, message: '控制台模式，无需测试连接' }
            }

            if (emailConfig.provider === 'SMTP' && emailConfig.smtp) {
                const transporter = nodemailer.createTransport({
                    host: emailConfig.smtp.host,
                    port: emailConfig.smtp.port,
                    secure: emailConfig.smtp.secure,
                    auth: emailConfig.smtp.auth
                })

                await transporter.verify()
                return { success: true, message: 'SMTP 连接成功' }
            }

            return { success: true, message: `${emailConfig.provider} 配置已加载` }
        } catch (error: any) {
            return { success: false, message: error.message }
        }
    },

    /**
     * 获取当前配置状态
     */
    getStatus(): { provider: EmailProvider; configured: boolean } {
        return {
            provider: emailConfig.provider,
            configured: emailConfig.provider === 'CONSOLE' ||
                (emailConfig.provider === 'SMTP' && !!emailConfig.smtp) ||
                (emailConfig.provider === 'SENDGRID' && !!emailConfig.sendgrid?.apiKey) ||
                (emailConfig.provider === 'AWS_SES' && !!emailConfig.awsSes)
        }
    }
}

export default emailSenderService
