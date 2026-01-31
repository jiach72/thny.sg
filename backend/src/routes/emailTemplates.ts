import { Router, Request, Response, NextFunction } from 'express'
import { body, param, query } from 'express-validator'
import { emailTemplateService } from '../services/emailTemplateService.js'
import { validate, authMiddleware } from '../middlewares/index.js'

const router = Router()

// ==================== 模板管理 ====================

/**
 * GET /email-templates - 获取所有模板
 */
router.get(
    '/',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const category = req.query.category as string | undefined
            const includeInactive = req.query.includeInactive === 'true'
            const templates = await emailTemplateService.getTemplates(category, includeInactive)
            res.json(templates)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /email-templates/:id - 获取模板详情
 */
router.get(
    '/:id',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const template = await emailTemplateService.getTemplateById(req.params.id)
            if (!template) {
                return res.status(404).json({ message: '模板不存在' })
            }
            res.json(template)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /email-templates - 创建模板
 */
router.post(
    '/',
    authMiddleware,
    [
        body('name').notEmpty().withMessage('模板名称不能为空'),
        body('subject').notEmpty().withMessage('邮件主题不能为空'),
        body('body').notEmpty().withMessage('邮件内容不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const template = await emailTemplateService.createTemplate(req.body, req.user!.id)
            res.status(201).json(template)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * PUT /email-templates/:id - 更新模板
 */
router.put(
    '/:id',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const template = await emailTemplateService.updateTemplate(req.params.id, req.body)
            res.json(template)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * DELETE /email-templates/:id - 删除模板
 */
router.delete(
    '/:id',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await emailTemplateService.deleteTemplate(req.params.id)
            res.json({ success: true, message: '模板已删除' })
        } catch (error) {
            next(error)
        }
    }
)

// ==================== 预览与发送 ====================

/**
 * POST /email-templates/:id/preview - 预览模板
 */
router.post(
    '/:id/preview',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const context = {
                lead: req.body.lead,
                customer: req.body.customer,
                custom: req.body.custom
            }
            const preview = await emailTemplateService.previewTemplate(req.params.id, context)
            res.json(preview)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /email-templates/:id/send - 使用模板发送邮件
 */
router.post(
    '/:id/send',
    authMiddleware,
    [
        param('id').notEmpty(),
        body('recipient').isEmail().withMessage('收件人邮箱格式不正确'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const context = {
                lead: req.body.lead,
                customer: req.body.customer,
                custom: req.body.custom
            }
            const result = await emailTemplateService.sendWithTemplate(
                req.params.id,
                req.body.recipient,
                context,
                { leadId: req.body.leadId, customerId: req.body.customerId },
                req.user!.id
            )
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /email-templates/send-direct - 直接发送邮件（不使用模板）
 */
router.post(
    '/send-direct',
    authMiddleware,
    [
        body('recipient').isEmail().withMessage('收件人邮箱格式不正确'),
        body('subject').notEmpty().withMessage('邮件主题不能为空'),
        body('body').notEmpty().withMessage('邮件内容不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await emailTemplateService.sendEmail({
                recipient: req.body.recipient,
                subject: req.body.subject,
                body: req.body.body,
                leadId: req.body.leadId,
                customerId: req.body.customerId
            }, req.user!.id)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

// ==================== 发送记录 ====================

/**
 * GET /email-templates/logs - 获取发送记录
 */
router.get(
    '/logs',
    authMiddleware,
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters = {
                leadId: req.query.leadId as string | undefined,
                customerId: req.query.customerId as string | undefined,
                templateId: req.query.templateId as string | undefined,
                status: req.query.status as string | undefined,
            }
            const pagination = {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20
            }
            const result = await emailTemplateService.getEmailLogs(filters, pagination)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /email-templates/seed - 初始化默认模板
 */
router.post(
    '/seed',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await emailTemplateService.seedDefaultTemplates()
            res.json({ success: true, message: '默认邮件模板已初始化' })
        } catch (error) {
            next(error)
        }
    }
)

export default router
