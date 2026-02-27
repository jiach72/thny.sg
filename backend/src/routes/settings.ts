import express from 'express'
import { prisma } from '../config/index.js'
import { authMiddleware, requireRole } from '../middlewares/index.js'
import { emailSenderService } from '../services/emailSenderService.js'

const authenticateToken = authMiddleware
const requireAdmin = requireRole('ADMIN')

const router = express.Router()

// 获取 AI 设置
router.get('/ai', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: { category: 'AI' }
        })

        // 转换为键值对对象
        const config = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value
            return acc
        }, {} as Record<string, string>)

        res.json({
            code: 200,
            data: config
        })
    } catch (error) {
        console.error('Error fetching AI settings:', error)
        res.status(500).json({ code: 500, message: 'Failed to fetch settings' })
    }
})

// 保存 AI 设置
router.post('/ai', authenticateToken, requireAdmin, async (req, res) => {
    const { provider, apiKey, modelName, baseUrl } = req.body

    try {
        const upsertSetting = (key: string, value: string) => {
            if (value === undefined || value === null) return null

            return prisma.systemSetting.upsert({
                where: { key },
                update: { value },
                create: {
                    key,
                    value,
                    category: 'AI',
                    description: `AI setting for ${key}`
                }
            })
        }

        const operations = [
            upsertSetting('AI_PROVIDER', provider),
            upsertSetting('AI_API_KEY', apiKey),
            upsertSetting('AI_MODEL_NAME', modelName),
            upsertSetting('AI_BASE_URL', baseUrl)
        ].filter(Boolean)

        await Promise.all(operations)

        res.json({ code: 200, message: 'Settings saved' })
    } catch (error) {
        console.error('Error saving AI settings:', error)
        res.status(500).json({ code: 500, message: 'Failed to save settings' })
    }
})

// 获取邮件设置
router.get('/email', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: { category: 'EMAIL' }
        })

        const config = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value
            return acc
        }, {} as Record<string, string>)

        res.json({
            code: 200,
            data: config
        })
    } catch (error) {
        console.error('Error fetching email settings:', error)
        res.status(500).json({ code: 500, message: 'Failed to fetch settings' })
    }
})

// 保存邮件设置
router.post('/email', authenticateToken, requireAdmin, async (req, res) => {
    const { provider, smtpHost, smtpPort, smtpUser, smtpPass, defaultFrom } = req.body

    try {
        const upsertSetting = (key: string, value: string) => {
            if (value === undefined || value === null) return null

            return prisma.systemSetting.upsert({
                where: { key },
                update: { value: String(value) },
                create: {
                    key,
                    value: String(value),
                    category: 'EMAIL',
                    description: `Email setting for ${key}`
                }
            })
        }

        const operations = [
            upsertSetting('EMAIL_PROVIDER', provider),
            upsertSetting('SMTP_HOST', smtpHost),
            upsertSetting('SMTP_PORT', smtpPort),
            upsertSetting('SMTP_USER', smtpUser),
            upsertSetting('SMTP_PASS', smtpPass),
            upsertSetting('EMAIL_FROM', defaultFrom)
        ].filter(Boolean)

        await Promise.all(operations)

        // 重载内存里的邮件配置
        await emailSenderService.initialize()

        res.json({ code: 200, message: 'Settings saved and email service reloaded' })
    } catch (error) {
        console.error('Error saving email settings:', error)
        res.status(500).json({ code: 500, message: 'Failed to save settings' })
    }
})

export default router
