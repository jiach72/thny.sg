import express, { Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { prisma } from '../config/index.js'
import { authMiddleware, requireRole, validate } from '../middlewares/index.js'
import { emailSenderService } from '../services/emailSenderService.js'
import { sendSuccess } from '../utils/responseHelper.js'

const authenticateToken = authMiddleware
const requireAdmin = requireRole('ADMIN')

const router = express.Router()

// 获取 AI 设置
router.get('/ai', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: { category: 'AI' }
        })

        // 转换为键值对对象
        const config = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value
            return acc
        }, {} as Record<string, string>)

        sendSuccess(res, config)
    } catch (error) {
        next(error)
    }
})

// 保存 AI 设置
router.post('/ai', authenticateToken, requireAdmin,
    [
        body('provider').optional().isIn(['openai','zhipu','ollama']),
        body('apiKey').optional().isString(),
        body('model').optional().isString(),
        body('temperature').optional().isFloat({min:0,max:2}),
        body('maxTokens').optional().isInt({min:1}),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
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

        sendSuccess(res, null, 'Settings saved')
    } catch (error) {
        next(error)
    }
})

// 获取邮件设置
router.get('/email', authenticateToken, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: { category: 'EMAIL' }
        })

        const config = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value
            return acc
        }, {} as Record<string, string>)

        sendSuccess(res, config)
    } catch (error) {
        next(error)
    }
})

// 保存邮件设置
router.post('/email', authenticateToken, requireAdmin,
    [
        body('host').notEmpty().withMessage('SMTP主机不能为空'),
        body('port').optional().isInt({min:1,max:65535}),
        body('secure').optional().isBoolean(),
        body('user').optional().isString(),
        body('pass').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
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

        sendSuccess(res, null, 'Settings saved and email service reloaded')
    } catch (error) {
        next(error)
    }
})

export default router
