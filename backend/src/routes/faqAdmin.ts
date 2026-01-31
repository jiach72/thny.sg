import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middlewares/auth.js'
import { prisma } from '../config/index.js'
import { faqService } from '../services/faqService.js'
import { chatService } from '../services/chatService.js'

const router = Router()

// ==================== 无需认证的路由 ====================

/**
 * 下载导入模板（无需认证，模板是空白文件）
 * GET /api/v1/faq-admin/import/template
 */
router.get('/import/template', async (req: Request, res: Response) => {
    try {
        const XLSX = await import('xlsx')

        // 准备数据头和示例行
        const headers = ['Category', 'Question', 'Answer', 'QuestionEn', 'AnswerEn', 'Keywords']
        const sample = ['移民服务', '申请EP需要什么条件？', '申请EP需要月薪至少5000新币...', 'What are the requirements for EP?', 'EP requires minimum salary of SGD 5000...', 'EP, 工作准证, 薪资']

        const ws = XLSX.utils.aoa_to_sheet([headers, sample])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'FAQ导入模板')

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', 'attachment; filename=faq_template.xlsx')
        res.send(buffer)
    } catch (error) {
        console.error('Template gen error:', error)
        res.status(500).send('Error generating template')
    }
})

// ==================== 需要认证的路由 ====================
router.use(authMiddleware)

// ==================== FAQ 分类管理 ====================

/**
 * 获取所有 FAQ 分类（包含已禁用）
 * GET /api/v1/faq-admin/categories
 */
router.get('/categories', async (req: Request, res: Response) => {
    try {
        const categories = await faqService.getCategories(true) // 包含已禁用
        res.json({ success: true, data: categories })
    } catch (error) {
        console.error('Error fetching FAQ categories:', error)
        res.status(500).json({ success: false, message: '获取分类失败' })
    }
})

/**
 * 创建 FAQ 分类
 * POST /api/v1/faq-admin/categories
 */
router.post('/categories', async (req: Request, res: Response) => {
    try {
        const { name, nameEn, description, sortOrder } = req.body

        if (!name) {
            return res.status(400).json({ success: false, message: '分类名称不能为空' })
        }

        const category = await faqService.createCategory({
            name,
            nameEn,
            description,
            sortOrder
        })

        res.json({ success: true, data: category, message: '分类创建成功' })
    } catch (error) {
        console.error('Error creating FAQ category:', error)
        res.status(500).json({ success: false, message: '创建分类失败' })
    }
})

/**
 * 更新 FAQ 分类
 * PUT /api/v1/faq-admin/categories/:id
 */
router.put('/categories/:id', async (req: Request, res: Response) => {
    try {
        const { name, nameEn, description, sortOrder, isActive } = req.body

        const category = await faqService.updateCategory(req.params.id, {
            name,
            nameEn,
            description,
            sortOrder,
            isActive
        })

        res.json({ success: true, data: category, message: '分类更新成功' })
    } catch (error) {
        console.error('Error updating FAQ category:', error)
        res.status(500).json({ success: false, message: '更新分类失败' })
    }
})

/**
 * 删除（禁用）FAQ 分类
 * DELETE /api/v1/faq-admin/categories/:id
 */
router.delete('/categories/:id', async (req: Request, res: Response) => {
    try {
        await faqService.deleteCategory(req.params.id)
        res.json({ success: true, message: '分类已禁用' })
    } catch (error) {
        console.error('Error deleting FAQ category:', error)
        res.status(500).json({ success: false, message: '删除分类失败' })
    }
})

// ==================== FAQ 条目管理 ====================

/**
 * 获取所有 FAQ 条目
 * GET /api/v1/faq-admin/items
 */
router.get('/items', async (req: Request, res: Response) => {
    try {
        const categoryId = req.query.categoryId as string | undefined
        const items = await faqService.getItems(categoryId, true) // 包含已禁用
        res.json({ success: true, data: items })
    } catch (error) {
        console.error('Error fetching FAQ items:', error)
        res.status(500).json({ success: false, message: '获取条目失败' })
    }
})

/**
 * 获取单个 FAQ 条目
 * GET /api/v1/faq-admin/items/:id
 */
router.get('/items/:id', async (req: Request, res: Response) => {
    try {
        const item = await faqService.getItemById(req.params.id)
        if (!item) {
            return res.status(404).json({ success: false, message: 'FAQ 不存在' })
        }
        res.json({ success: true, data: item })
    } catch (error) {
        console.error('Error fetching FAQ item:', error)
        res.status(500).json({ success: false, message: '获取条目失败' })
    }
})

/**
 * 创建 FAQ 条目
 * POST /api/v1/faq-admin/items
 */
router.post('/items', async (req: Request, res: Response) => {
    try {
        const { question, questionEn, answer, answerEn, keywords, categoryId, sortOrder } = req.body

        if (!question || !answer || !categoryId) {
            return res.status(400).json({ success: false, message: '问题、答案和分类为必填项' })
        }

        const item = await faqService.createItem({
            question,
            questionEn,
            answer,
            answerEn,
            keywords: keywords || [],
            categoryId,
            sortOrder
        })

        res.json({ success: true, data: item, message: 'FAQ 创建成功' })
    } catch (error) {
        console.error('Error creating FAQ item:', error)
        res.status(500).json({ success: false, message: '创建条目失败' })
    }
})

/**
 * 更新 FAQ 条目
 * PUT /api/v1/faq-admin/items/:id
 */
router.put('/items/:id', async (req: Request, res: Response) => {
    try {
        const { question, questionEn, answer, answerEn, keywords, categoryId, sortOrder, isActive } = req.body

        const item = await faqService.updateItem(req.params.id, {
            question,
            questionEn,
            answer,
            answerEn,
            keywords,
            categoryId,
            sortOrder,
            isActive
        })

        res.json({ success: true, data: item, message: 'FAQ 更新成功' })
    } catch (error) {
        console.error('Error updating FAQ item:', error)
        res.status(500).json({ success: false, message: '更新条目失败' })
    }
})


/**
 * 删除（禁用）FAQ 条目
 * DELETE /api/v1/faq-admin/items/:id
 */
router.delete('/items/:id', async (req: Request, res: Response) => {
    try {
        await faqService.deleteItem(req.params.id)
        res.json({ success: true, message: 'FAQ 已禁用' })
    } catch (error) {
        console.error('Error deleting FAQ item:', error)
        res.status(500).json({ success: false, message: '删除条目失败' })
    }
})

// ==================== 批量导入 ====================

import multer from 'multer'
const upload = multer({ storage: multer.memoryStorage() })

/**
 * 导入 FAQ 数据
 * POST /api/v1/faq-admin/import
 */
router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '请上传文件' })
        }

        const result = await faqService.importFromBuffer(req.file.buffer)

        res.json({
            success: true,
            data: result,
            message: `导入完成: 成功 ${result.success} 条，失败 ${result.failed} 条`
        })
    } catch (error) {
        console.error('Import error:', error)
        res.status(500).json({ success: false, message: '导入失败: ' + (error as Error).message })
    }
})

// ==================== 聊天记录管理 ====================

/**
 * 获取聊天会话列表
 * GET /api/v1/faq-admin/sessions
 */
router.get('/sessions', async (req: Request, res: Response) => {
    try {
        const { status, page = 1, pageSize = 20 } = req.query

        const where: any = {}
        if (status) {
            where.status = status
        }

        const [sessions, total] = await Promise.all([
            prisma.chatSession.findMany({
                where,
                include: {
                    _count: {
                        select: { messages: true }
                    }
                },
                orderBy: { updatedAt: 'desc' },
                skip: (Number(page) - 1) * Number(pageSize),
                take: Number(pageSize)
            }),
            prisma.chatSession.count({ where })
        ])

        res.json({
            success: true,
            data: sessions,
            pagination: {
                page: Number(page),
                pageSize: Number(pageSize),
                total,
                totalPages: Math.ceil(total / Number(pageSize))
            }
        })
    } catch (error) {
        console.error('Error fetching chat sessions:', error)
        res.status(500).json({ success: false, message: '获取会话列表失败' })
    }
})

/**
 * 获取会话详情和消息
 * GET /api/v1/faq-admin/sessions/:id
 */
router.get('/sessions/:id', async (req: Request, res: Response) => {
    try {
        const session = await prisma.chatSession.findUnique({
            where: { id: req.params.id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        })

        if (!session) {
            return res.status(404).json({ success: false, message: '会话不存在' })
        }

        res.json({ success: true, data: session })
    } catch (error) {
        console.error('Error fetching chat session:', error)
        res.status(500).json({ success: false, message: '获取会话详情失败' })
    }
})

/**
 * 关闭/归档会话
 * PUT /api/v1/faq-admin/sessions/:id/status
 */
router.put('/sessions/:id/status', async (req: Request, res: Response) => {
    try {
        const { status } = req.body

        if (!['active', 'closed', 'archived'].includes(status)) {
            return res.status(400).json({ success: false, message: '无效的状态' })
        }

        const session = await prisma.chatSession.update({
            where: { id: req.params.id },
            data: {
                status,
                closedAt: status === 'closed' ? new Date() : undefined
            }
        })

        res.json({ success: true, data: session, message: '状态更新成功' })
    } catch (error) {
        console.error('Error updating session status:', error)
        res.status(500).json({ success: false, message: '更新状态失败' })
    }
})

// ==================== 未识别问题管理 ====================

/**
 * 获取未识别问题列表
 * GET /api/v1/faq-admin/unrecognized
 */
router.get('/unrecognized', async (req: Request, res: Response) => {
    try {
        const status = (req.query.status as string) || 'pending'
        const questions = await chatService.getUnrecognizedQuestions(status)
        res.json({ success: true, data: questions })
    } catch (error) {
        console.error('Error fetching unrecognized questions:', error)
        res.status(500).json({ success: false, message: '获取失败' })
    }
})

/**
 * 更新未识别问题状态
 * PUT /api/v1/faq-admin/unrecognized/:id
 */
router.put('/unrecognized/:id', async (req: Request, res: Response) => {
    try {
        const { status } = req.body

        if (!['pending', 'added', 'ignored'].includes(status)) {
            return res.status(400).json({ success: false, message: '无效的状态' })
        }

        const question = await prisma.unrecognizedQuestion.update({
            where: { id: req.params.id },
            data: { status }
        })

        res.json({ success: true, data: question, message: '状态更新成功' })
    } catch (error) {
        console.error('Error updating unrecognized question:', error)
        res.status(500).json({ success: false, message: '更新失败' })
    }
})

// ==================== 统计数据 ====================

/**
 * 获取聊天机器人统计
 * GET /api/v1/faq-admin/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const [
            totalSessions,
            activeSessions,
            totalMessages,
            totalFaqs,
            pendingUnrecognized,
            topFaqs
        ] = await Promise.all([
            prisma.chatSession.count(),
            prisma.chatSession.count({ where: { status: 'active' } }),
            prisma.chatMessage.count(),
            prisma.faqItem.count({ where: { isActive: true } }),
            prisma.unrecognizedQuestion.count({ where: { status: 'pending' } }),
            prisma.faqItem.findMany({
                where: { isActive: true },
                orderBy: { viewCount: 'desc' },
                take: 5,
                select: { id: true, question: true, viewCount: true, helpfulCount: true }
            })
        ])

        res.json({
            success: true,
            data: {
                totalSessions,
                activeSessions,
                totalMessages,
                totalFaqs,
                pendingUnrecognized,
                topFaqs
            }
        })
    } catch (error) {
        console.error('Error fetching stats:', error)
        res.status(500).json({ success: false, message: '获取统计失败' })
    }
})

export default router
