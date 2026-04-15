import { Router, Request, Response, NextFunction } from 'express'
import { body, query, param } from 'express-validator'
import { claimService } from '../services/claimService.js'
import { validate, authMiddleware } from '../middlewares/index.js'
import { sendSuccess, sendError, success } from '../utils/responseHelper.js'
import multer from 'multer'
import path from 'path'

// 收据上传配置
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, 'uploads/receipts/')
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
        cb(null, `receipt-${uniqueSuffix}${path.extname(file.originalname)}`)
    },
})

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 限制
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('只支持 JPG/PNG/GIF/WebP/PDF 格式'))
        }
    },
})

const router = Router()

/**
 * @openapi
 * /claims:
 *   get:
 *     tags: [Claims]
 *     summary: 获取报销单列表
 *     description: 管理员/经理可查看所有报销单，普通用户仅查看自己提交的
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 报销单状态筛选
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取报销单列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Claim'
 *       401:
 *         description: 未授权
 */
// 获取报销列表
router.get(
    '/',
    authMiddleware,
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('status').optional().isString(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('projectId').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = Number(req.query.page) || 1
            const limit = Number(req.query.limit) || 20
            const user = req.user!

            // RBAC: 检查角色决定是否只看自己的
            const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(user.role?.toUpperCase() || '')

            const filters = {
                submitterId: isAdminOrManager ? (req.query.submitterId as string) : user.id,
                status: req.query.status as any,
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string,
                projectId: req.query.projectId as string,
            }

            const result = await claimService.getClaimList(filters, { page, limit })
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * @openapi
 * /claims/stats:
 *   get:
 *     tags: [Claims]
 *     summary: 获取报销统计
 *     description: 管理员/经理可查看全局统计，普通用户仅查看个人统计
 *     responses:
 *       200:
 *         description: 成功获取报销统计
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 data:
 *                   type: object
 *       401:
 *         description: 未授权
 */
// 获取报销统计
router.get(
    '/stats',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user!
            const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(user.role?.toUpperCase() || '')
            const submitterId = isAdminOrManager ? undefined : user.id
            const stats = await claimService.getClaimStats(submitterId)
            sendSuccess(res, stats)
        } catch (error) {
            next(error)
        }
    }
)

// 获取报销详情
router.get(
    '/:id',
    authMiddleware,
    [param('id').isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const claim = await claimService.getClaimById(req.params.id)
            sendSuccess(res, claim)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * @openapi
 * /claims:
 *   post:
 *     tags: [Claims]
 *     summary: 创建报销单
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               currency:
 *                 type: string
 *               projectId:
 *                 type: string
 *     responses:
 *       201:
 *         description: 报销单创建成功
 *       401:
 *         description: 未授权
 */
// 创建报销单
router.post(
    '/',
    authMiddleware,
    [
        body('title').notEmpty().withMessage('标题不能为空'),
        body('currency').optional().isString(),
        body('projectId').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const claim = await claimService.createClaim(req.body, req.user!.id)
            res.status(201).json(success(claim))
        } catch (error) {
            next(error)
        }
    }
)

/**
 * @openapi
 * /claims/{id}/submit:
 *   post:
 *     tags: [Claims]
 *     summary: 提交报销单审批
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 提交成功
 *       401:
 *         description: 未授权
 *       404:
 *         description: 报销单不存在
 */
// 提交审批
router.post(
    '/:id/submit',
    authMiddleware,
    [param('id').isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const claim = await claimService.submitClaim(req.params.id, req.user!.id)
            sendSuccess(res, claim)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * @openapi
 * /claims/{id}/approve:
 *   post:
 *     tags: [Claims]
 *     summary: 审批通过报销单
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: 审批成功
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无审批权限
 */
// 审批通过
router.post(
    '/:id/approve',
    authMiddleware,
    [
        param('id').isString(),
        body('comment').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const isAdmin = ['ADMIN'].includes(req.user!.role?.toUpperCase() || '')
            const claim = await claimService.approveClaim(
                req.params.id,
                req.user!.id,
                req.body.comment,
                isAdmin
            )
            sendSuccess(res, claim)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * @openapi
 * /claims/{id}/reject:
 *   post:
 *     tags: [Claims]
 *     summary: 驳回报销单
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 驳回成功
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无审批权限
 */
// 驳回
router.post(
    '/:id/reject',
    authMiddleware,
    [
        param('id').isString(),
        body('reason').notEmpty().withMessage('驳回原因不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const claim = await claimService.rejectClaim(req.params.id, req.user!.id, req.body.reason)
            sendSuccess(res, claim)
        } catch (error) {
            next(error)
        }
    }
)

// 标记已付款
router.post(
    '/:id/pay',
    authMiddleware,
    [
        param('id').isString(),
        body('paymentRef').notEmpty().withMessage('付款参考号不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const claim = await claimService.markAsPaid(req.params.id, req.body.paymentRef)
            sendSuccess(res, claim)
        } catch (error) {
            next(error)
        }
    }
)

// 重新编辑（驳回后）
router.post(
    '/:id/resubmit',
    authMiddleware,
    [param('id').isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const claim = await claimService.resubmitClaim(req.params.id, req.user!.id)
            sendSuccess(res, claim)
        } catch (error) {
            next(error)
        }
    }
)

// 添加报销明细
router.post(
    '/:id/items',
    authMiddleware,
    [
        param('id').isString(),
        body('description').notEmpty().withMessage('费用说明不能为空'),
        body('amount').isNumeric().withMessage('金额必须为数字'),
        body('expenseDate').isISO8601().withMessage('日期格式不正确'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const item = await claimService.addClaimItem(req.params.id, req.body, req.user!.id)
            res.status(201).json(success(item))
        } catch (error) {
            next(error)
        }
    }
)

// 删除报销明细
router.delete(
    '/:id/items/:itemId',
    authMiddleware,
    [
        param('id').isString(),
        param('itemId').isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await claimService.removeClaimItem(req.params.id, req.params.itemId, req.user!.id)
            sendSuccess(res, null, '明细已删除')
        } catch (error) {
            next(error)
        }
    }
)

// 上传收据
router.post(
    '/:id/items/:itemId/receipt',
    authMiddleware,
    upload.single('receipt'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.file) {
                return sendError(res, '请上传收据文件', 400)
            }

            const receiptUrl = `/uploads/receipts/${req.file.filename}`
            const item = await claimService.uploadReceipt(
                req.params.itemId,
                receiptUrl,
                req.file.originalname
            )
            sendSuccess(res, item)
        } catch (error) {
            next(error)
        }
    }
)

export default router
