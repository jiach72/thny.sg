import { Router, Request, Response, NextFunction } from 'express'
import { body, param, query } from 'express-validator'
import { invoiceService } from '../services/invoiceService.js'
import { validate, authMiddleware, adminAuth } from '../middlewares/index.js'
import { sendSuccess, sendError, success } from '../utils/responseHelper.js'

const router = Router()

// 发票管理路由仅限管理端用户（排除 CUSTOMER 角色，客户通过 portal 访问自己的发票）
router.use(authMiddleware)
router.use(adminAuth)

// ==================== 发票管理 ====================

/**
 * GET /invoices - 获取发票列表
 */
router.get(
    '/',
    authMiddleware,
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters = {
                projectId: req.query.projectId as string | undefined,
                customerId: req.query.customerId as string | undefined,
                status: req.query.status as string | undefined,
            }
            const pagination = {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20
            }
            const result = await invoiceService.getInvoices(filters, pagination)
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /invoices/stats - 获取发票统计
 */
router.get(
    '/stats',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const customerId = req.query.customerId as string | undefined
            const stats = await invoiceService.getInvoiceStats(customerId)
            sendSuccess(res, stats)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /invoices/:id - 获取发票详情
 */
router.get(
    '/:id',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const invoice = await invoiceService.getInvoiceById(req.params.id)
            if (!invoice) {
                return sendError(res, '发票不存在', 404)
            }
            sendSuccess(res, invoice)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /invoices - 创建发票
 */
router.post(
    '/',
    authMiddleware,
    [
        body('projectId').notEmpty().withMessage('项目ID不能为空'),
        body('customerId').notEmpty().withMessage('客户ID不能为空'),
        body('title').notEmpty().withMessage('发票标题不能为空'),
        body('items').isArray({ min: 1 }).withMessage('发票明细不能为空'),
        body('issueDate').notEmpty().withMessage('开票日期不能为空'),
        body('dueDate').notEmpty().withMessage('到期日不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const invoice = await invoiceService.createInvoice(req.body, req.user!.id)
            res.status(201).json(success(invoice))
        } catch (error) {
            next(error)
        }
    }
)

/**
 * PUT /invoices/:id - 更新发票
 */
router.put(
    '/:id',
    authMiddleware,
    [
        param('id').notEmpty(),
        body('status').optional().isIn(['DRAFT','SENT','PAID','OVERDUE','CANCELLED']),
        body('dueDate').optional().isISO8601(),
        body('items').optional().isArray(),
        body('notes').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const invoice = await invoiceService.updateInvoice(req.params.id, req.body)
            sendSuccess(res, invoice)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * DELETE /invoices/:id - 删除发票
 */
router.delete(
    '/:id',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await invoiceService.deleteInvoice(req.params.id)
            sendSuccess(res, null, '发票已删除')
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /invoices/:id/send - 发送发票
 */
router.post(
    '/:id/send',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const invoice = await invoiceService.sendInvoice(req.params.id)
            sendSuccess(res, invoice)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /invoices/:id/cancel - 取消发票
 */
router.post(
    '/:id/cancel',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const invoice = await invoiceService.cancelInvoice(req.params.id)
            sendSuccess(res, invoice)
        } catch (error) {
            next(error)
        }
    }
)

// ==================== 收款记录 ====================

/**
 * GET /invoices/:id/payments - 获取发票的收款记录
 */
router.get(
    '/:id/payments',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const pagination = {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20
            }
            const result = await invoiceService.getPayments({ invoiceId: req.params.id }, pagination)
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /invoices/:id/payments - 记录收款
 */
router.post(
    '/:id/payments',
    authMiddleware,
    [
        param('id').notEmpty(),
        body('amount').isFloat({ gt: 0 }).withMessage('收款金额必须大于0'),
        body('paymentMethod').notEmpty().withMessage('付款方式不能为空'),
        body('paymentDate').notEmpty().withMessage('收款日期不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payment = await invoiceService.recordPayment({
                invoiceId: req.params.id,
                ...req.body
            }, req.user!.id)
            res.status(201).json(success(payment))
        } catch (error) {
            next(error)
        }
    }
)

/**
 * DELETE /payments/:id - 删除收款记录
 */
router.delete(
    '/payments/:id',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await invoiceService.deletePayment(req.params.id)
            sendSuccess(res, null, '收款记录已删除')
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /invoices/check-overdue - 检查并更新逾期发票
 */
router.post(
    '/check-overdue',
    authMiddleware,
    adminAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await invoiceService.checkOverdueInvoices()
            sendSuccess(res, result, `已更新 ${result.updated} 条逾期发票`)
        } catch (error) {
            next(error)
        }
    }
)

export default router
