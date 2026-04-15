import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { authMiddleware, adminAuth } from '../middlewares/auth.js'
import { validate } from '../middlewares/index.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'
import { prisma } from '../config/index.js'
import { faqService } from '../services/faqService.js'
import { chatService } from '../services/chatService.js'

const router = Router()

// ==================== 无需认证的路由 ====================

/**
 * 下载导入模板（无需认证，模板是空白文件）
 * GET /api/v1/faq-admin/import/template
 */
router.get('/import/template', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ExcelJS = await import('exceljs')
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('FAQ导入模板')

        // 准备数据头和示例行
        const headers = ['Category', 'Question', 'Answer', 'QuestionEn', 'AnswerEn', 'Keywords']
        const sample = ['移民服务', '申请EP需要什么条件？', '申请EP需要月薪至少5000新币...', 'What are the requirements for EP?', 'EP requires minimum salary of SGD 5000...', 'EP, 工作准证, 薪资']

        worksheet.addRow(headers)
        worksheet.addRow(sample)

        const buffer = await workbook.xlsx.writeBuffer()

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', 'attachment; filename=faq_template.xlsx')
        res.send(Buffer.from(buffer))
    } catch (error) {
        next(error)
    }
})

// ==================== 需要认证的路由 ====================
router.use(authMiddleware)
// 所有管理路由需要管理员权限
router.use(adminAuth)

// ==================== FAQ 分类管理 ====================

/**
 * 获取所有 FAQ 分类（包含已禁用）
 * GET /api/v1/faq-admin/categories
 */
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await faqService.getCategories(true) // 包含已禁用
        sendSuccess(res, categories)
    } catch (error) {
        next(error)
    }
})

/**
 * 创建 FAQ 分类
 * POST /api/v1/faq-admin/categories
 */
router.post('/categories',
    [
        body('name').notEmpty().withMessage('分类名称不能为空'),
        body('icon').optional().isString(),
        body('sortOrder').optional().isInt(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, nameEn, description, sortOrder } = req.body

        if (!name) {
            return sendError(res, '分类名称不能为空', 400)
        }

        const category = await faqService.createCategory({
            name,
            nameEn,
            description,
            sortOrder
        })

        sendSuccess(res, category, '分类创建成功')
    } catch (error) {
        next(error)
    }
})

/**
 * 更新 FAQ 分类
 * PUT /api/v1/faq-admin/categories/:id
 */
router.put('/categories/:id',
    [
        body('name').optional().isString(),
        body('icon').optional().isString(),
        body('sortOrder').optional().isInt(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, nameEn, description, sortOrder, isActive } = req.body

        const category = await faqService.updateCategory(req.params.id, {
            name,
            nameEn,
            description,
            sortOrder,
            isActive
        })

        sendSuccess(res, category, '分类更新成功')
    } catch (error) {
        next(error)
    }
})

/**
 * 删除（禁用）FAQ 分类
 * DELETE /api/v1/faq-admin/categories/:id
 */
router.delete('/categories/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await faqService.deleteCategory(req.params.id)
        sendSuccess(res, null, '分类已禁用')
    } catch (error) {
        next(error)
    }
})

// ==================== FAQ 条目管理 ====================

/**
 * 获取所有 FAQ 条目
 * GET /api/v1/faq-admin/items
 */
router.get('/items', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categoryId = req.query.categoryId as string | undefined
        const items = await faqService.getItems(categoryId, true) // 包含已禁用
        sendSuccess(res, items)
    } catch (error) {
        next(error)
    }
})

/**
 * 获取单个 FAQ 条目
 * GET /api/v1/faq-admin/items/:id
 */
router.get('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const item = await faqService.getItemById(req.params.id)
        if (!item) {
            return sendError(res, 'FAQ 不存在', 404)
        }
        sendSuccess(res, item)
    } catch (error) {
        next(error)
    }
})

/**
 * 创建 FAQ 条目
 * POST /api/v1/faq-admin/items
 */
router.post('/items',
    [
        body('question').notEmpty().withMessage('问题不能为空'),
        body('answer').notEmpty().withMessage('答案不能为空'),
        body('categoryId').notEmpty().withMessage('分类不能为空'),
        body('sortOrder').optional().isInt(),
        body('tags').optional().isArray(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { question, questionEn, answer, answerEn, keywords, categoryId, sortOrder } = req.body

        if (!question || !answer || !categoryId) {
            return sendError(res, '问题、答案和分类为必填项', 400)
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

        sendSuccess(res, item, 'FAQ 创建成功')
    } catch (error) {
        next(error)
    }
})

/**
 * 更新 FAQ 条目
 * PUT /api/v1/faq-admin/items/:id
 */
router.put('/items/:id',
    [
        body('question').optional().isString(),
        body('answer').optional().isString(),
        body('categoryId').optional().isString(),
        body('sortOrder').optional().isInt(),
        body('tags').optional().isArray(),
        body('enabled').optional().isBoolean(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
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

        sendSuccess(res, item, 'FAQ 更新成功')
    } catch (error) {
        next(error)
    }
})


/**
 * 删除（禁用）FAQ 条目
 * DELETE /api/v1/faq-admin/items/:id
 */
router.delete('/items/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await faqService.deleteItem(req.params.id)
        sendSuccess(res, null, 'FAQ 已禁用')
    } catch (error) {
        next(error)
    }
})

// ==================== 批量导入 ====================

import multer from 'multer'
const upload = multer({ storage: multer.memoryStorage() })

/**
 * 导入 FAQ 数据
 * POST /api/v1/faq-admin/import
 */
router.post('/import', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return sendError(res, '请上传文件', 400)
        }

        const result = await faqService.importFromBuffer(req.file.buffer)

        sendSuccess(res, result, `导入完成: 成功 ${result.success} 条，失败 ${result.failed} 条`)
    } catch (error) {
        next(error)
    }
})

// ==================== 聊天记录管理 ====================

/**
 * 获取聊天会话列表
 * GET /api/v1/faq-admin/sessions
 */
router.get('/sessions', async (req: Request, res: Response, next: NextFunction) => {
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

        sendSuccess(res, { items: sessions, pagination: {
                page: Number(page),
                pageSize: Number(pageSize),
                total,
                totalPages: Math.ceil(total / Number(pageSize))
            } })
    } catch (error) {
        next(error)
    }
})

/**
 * 获取会话详情和消息
 * GET /api/v1/faq-admin/sessions/:id
 */
router.get('/sessions/:id', async (req: Request, res: Response, next: NextFunction) => {
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
            return sendError(res, '会话不存在', 404)
        }

        sendSuccess(res, session)
    } catch (error) {
        next(error)
    }
})

/**
 * 关闭/归档会话
 * PUT /api/v1/faq-admin/sessions/:id/status
 */
router.put('/sessions/:id/status',
    [
        body('status').isIn(['ACTIVE', 'RESOLVED', 'CLOSED']).withMessage('状态值无效'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status } = req.body

        if (!['active', 'closed', 'archived'].includes(status)) {
            return sendError(res, '无效的状态', 400)
        }

        const session = await prisma.chatSession.update({
            where: { id: req.params.id },
            data: {
                status,
                closedAt: status === 'closed' ? new Date() : undefined
            }
        })

        sendSuccess(res, session, '状态更新成功')
    } catch (error) {
        next(error)
    }
})

// ==================== 未识别问题管理 ====================

/**
 * 获取未识别问题列表
 * GET /api/v1/faq-admin/unrecognized
 */
router.get('/unrecognized', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const status = (req.query.status as string) || 'pending'
        const questions = await chatService.getUnrecognizedQuestions(status)
        sendSuccess(res, questions)
    } catch (error) {
        next(error)
    }
})

/**
 * 更新未识别问题状态
 * PUT /api/v1/faq-admin/unrecognized/:id
 */
router.put('/unrecognized/:id',
    [
        body('status').isIn(['PENDING', 'RESOLVED', 'IGNORED']).withMessage('状态值无效'),
        body('resolvedAnswer').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status } = req.body

        if (!['pending', 'added', 'ignored'].includes(status)) {
            return sendError(res, '无效的状态', 400)
        }

        const question = await prisma.unrecognizedQuestion.update({
            where: { id: req.params.id },
            data: { status }
        })

        sendSuccess(res, question, '状态更新成功')
    } catch (error) {
        next(error)
    }
})

// ==================== 统计数据 ====================

/**
 * 获取聊天机器人统计
 * GET /api/v1/faq-admin/stats
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
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

        sendSuccess(res, {
                totalSessions,
                activeSessions,
                totalMessages,
                totalFaqs,
                pendingUnrecognized,
                topFaqs
            })
    } catch (error) {
        next(error)
    }
})

export default router
