import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware, requireRole } from '../middlewares/index.js'

const authenticateToken = authMiddleware
const requireAdmin = requireRole('ADMIN')

const router = express.Router()
const prisma = new PrismaClient()

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
            success: true,
            data: config
        })
    } catch (error) {
        console.error('Error fetching AI settings:', error)
        res.status(500).json({ success: false, error: 'Failed to fetch settings' })
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

        res.json({ success: true, message: 'Settings saved' })
    } catch (error) {
        console.error('Error saving AI settings:', error)
        res.status(500).json({ success: false, error: 'Failed to save settings' })
    }
})

export default router
