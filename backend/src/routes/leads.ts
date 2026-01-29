import { Router, Request, Response, NextFunction } from 'express'
import { body, param, query } from 'express-validator'
import { leadService } from '../services/index.js'
import { validate, authMiddleware, optionalAuth } from '../middlewares/index.js'
import { LeadStatus } from '@prisma/client'

const router = Router()

/**
 * GET /leads - 获取线索列表
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
            res.json(result)
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
        res.json(stats)
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
        res.json(activities)
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
            res.json(lead)
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
            res.status(201).json(lead)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /leads/webhook - 官网表单 Webhook (无需认证)
 */
router.post(
    '/webhook',
    optionalAuth,
    [
        body('name').notEmpty().withMessage('姓名不能为空'),
        body('email').optional().isEmail(),
        body('phone').optional().isString(),
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

            res.status(201).json({
                success: true,
                leadId: lead.id,
                message: '感谢您的咨询，我们的顾问将尽快与您联系',
            })
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
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const lead = await leadService.updateLead(
                req.params.id,
                req.body,
                req.user!.id
            )
            res.json(lead)
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
            res.json(lead)
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
            res.json(result)
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
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await leadService.convertToCustomer(req.params.id, req.user!.id)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

export default router
