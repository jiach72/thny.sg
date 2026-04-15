import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { body, param, query } from 'express-validator'
import rateLimit from 'express-rate-limit'
import { leadService } from '../services/index.js'
import { validate, authMiddleware, optionalAuth } from '../middlewares/index.js'
import { LeadStatus } from '@prisma/client'
import { sendSuccess, success } from '../utils/responseHelper.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Leads
 *   description: 线索管理接口
 */

/**
 * @swagger
 * /leads:
 *   get:
 *     summary: 获取线索列表
 *     tags: [Leads]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, CONVERTED, LOST] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: assignedToId
 *         schema: { type: string }
 *       - in: query
 *         name: sourceChannel
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 线索列表（分页）
 */
router.get(

    '/',
    authMiddleware,
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('status').optional().isString(),
        query('assignedToId').optional().isString(),
        query('sourceChannel').optional().isString(),
        query('country').optional().isString(),
        query('search').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters = {
                status: req.query.status as LeadStatus | undefined,
                assignedToId: req.query.assignedToId as string | undefined,
                sourceChannel: req.query.sourceChannel as string | undefined,
                country: req.query.country as string | undefined,
                search: req.query.search as string | undefined,
            }
            const pagination = {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20,
                sortBy: (req.query.sortBy as string) || 'createdAt',
                sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
            }

            const result = await leadService.getLeads(filters, pagination)
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /leads/stats - 获取线索统计
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await leadService.getLeadStats()
        sendSuccess(res, stats)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /leads/activities - 获取最近活动
 */
router.get('/activities', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 20
        const activities = await leadService.getRecentActivities(limit)
        sendSuccess(res, activities)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /leads/:id - 获取线索详情
 */
router.get(
    '/:id',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const lead = await leadService.getLeadById(req.params.id)
            sendSuccess(res, lead)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /leads/check-duplicates - 撞库检测
 */
router.post(
    '/check-duplicates',
    authMiddleware,
    [
        body('email').optional().isEmail(),
        body('phone').optional().isString(),
        body('excludeLeadId').optional().isString()
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, phone, excludeLeadId } = req.body
            const duplicates = await leadService.checkDuplicates(email, phone, excludeLeadId)
            sendSuccess(res, duplicates)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /leads - 创建线索
 */
router.post(
    '/',
    authMiddleware,
    [
        body('contactName').notEmpty().withMessage('联系人姓名不能为空'),
        body('email').optional().isEmail().withMessage('邮箱格式不正确'),
        body('phone').optional().isString(),
        body('sourceChannel').notEmpty().withMessage('来源渠道不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const lead = await leadService.createLead(req.body, req.user!.id)
            res.status(201).json(success(lead))
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /leads/webhook - 官网表单 Webhook (无需认证，但有速率限制)
 */
const webhookLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 分钟
    max: 10, // 每分钟最多 10 次提交
    message: { code: 'RATE_LIMITED', message: '提交过于频繁，请稍后再试' },
    standardHeaders: true,
    legacyHeaders: false,
})

router.post(
    '/webhook',
    webhookLimiter,
    optionalAuth,
    [
        body('name').notEmpty().withMessage('姓名不能为空'),
        body('email').optional({ values: 'falsy' }).isEmail(),
        body('phone').optional({ values: 'falsy' }).isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 将官网表单数据转换为线索格式
            const leadData = {
                contactName: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                companyName: req.body.company,
                country: req.body.country,
                serviceTypes: req.body.services || req.body.service_type
                    ? [req.body.services || req.body.service_type].flat()
                    : [],
                budgetRange: req.body.budget,
                sourceChannel: 'website_form',
                inquiryMessage: req.body.message,
                tags: ['website'],
            }

            const lead = await leadService.createLead(leadData)

            res.status(201).json(success({ leadId: lead.id }, '感谢您的咨询，我们的顾问将尽快与您联系'))
        } catch (error) {
            next(error)
        }
    }
)

/**
 * PUT /leads/:id - 更新线索
 */
router.put(
    '/:id',
    authMiddleware,
    [
        param('id').notEmpty(),
        body('name').optional().isString(),
        body('email').optional().isEmail(),
        body('phone').optional().isString(),
        body('company').optional().isString(),
        body('source').optional().isString(),
        body('status').optional().isIn(['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST']),
        body('estimatedValue').optional().isNumeric(),
        body('notes').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const lead = await leadService.updateLead(
                req.params.id,
                req.body,
                req.user!.id
            )
            sendSuccess(res, lead)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /leads/:id/notes - 添加线索备注
 */
router.post(
    '/:id/notes',
    authMiddleware,
    [
        param('id').notEmpty(),
        body('content').notEmpty().withMessage('备注内容不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const activity = await leadService.addNote(
                req.params.id,
                req.body.content,
                req.user!.id
            )
            sendSuccess(res, activity)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /leads/:id/assign - 分配线索
 */
router.post(
    '/:id/assign',
    authMiddleware,
    [
        param('id').notEmpty(),
        body('assignedToId').notEmpty().withMessage('分配对象不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const lead = await leadService.assignLead(
                req.params.id,
                req.body.assignedToId,
                req.user!.id,
                req.body.reason
            )
            sendSuccess(res, lead)
        } catch (error) {
            next(error)
        }
    }
)

const upload = multer({ storage: multer.memoryStorage() })

/**
 * POST /leads/import - 批量导入线索
 */
router.post(
    '/import',
    authMiddleware,
    upload.single('file'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.file) {
                throw new Error('请上传 CSV 文件')
            }
            const result = await leadService.importLeads(req.file.buffer, req.user!.id)
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * DELETE /leads/:id - 删除线索
 */
router.delete(
    '/:id',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await leadService.deleteLead(req.params.id)
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /leads/check-duplicates - 撞库检测
 */
router.post(
    '/check-duplicates',
    authMiddleware,
    [
        body('email').optional().isEmail(),
        body('phone').optional().isString(),
        body('excludeLeadId').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, phone, excludeLeadId } = req.body
            const result = await leadService.checkDuplicates(email, phone, excludeLeadId)
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /leads/:id/convert - 将线索转化为客户
 */
router.post(
    '/:id/convert',
    authMiddleware,
    [
        param('id').notEmpty(),
        body('email').optional().isEmail(),
        body('phone').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, phone } = req.body
            const result = await leadService.convertToCustomer(
                req.params.id,
                req.user!.id,
                { email, phone }
            )
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /leads/:id/ai-insight - 获取线索 AI 洞察分析
 */
router.get(
    '/:id/ai-insight',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { aiService } = await import('../services/aiService.js')
            const insight = await aiService.getLeadInsight(req.params.id)
            sendSuccess(res, insight)
        } catch (error) {
            next(error)
        }
    }
)

export default router
