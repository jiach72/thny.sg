import { Router, Request, Response, NextFunction } from 'express'
import { body, query, param } from 'express-validator'
import { claimService } from '../services/claimService.js'
import { validate, authMiddleware } from '../middlewares/index.js'
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
            const isAdminOrManager = user.role === 'admin' || user.role === 'ADMIN' || user.role === 'manager' || user.role === 'MANAGER'
            
            const filters = {
                submitterId: isAdminOrManager ? (req.query.submitterId as string) : user.id,
                status: req.query.status as any,
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string,
                projectId: req.query.projectId as string,
            }

            const result = await claimService.getClaimList(filters, { page, limit })
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

// 获取报销统计
router.get(
    '/stats',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user!
            const isAdminOrManager = user.role === 'admin' || user.role === 'ADMIN' || user.role === 'manager' || user.role === 'MANAGER'
            const submitterId = isAdminOrManager ? undefined : user.id
            const stats = await claimService.getClaimStats(submitterId)
            res.json(stats)
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
            res.json(claim)
        } catch (error) {
            next(error)
        }
    }
)

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
            res.status(201).json(claim)
        } catch (error) {
            next(error)
        }
    }
)

// 提交审批
router.post(
    '/:id/submit',
    authMiddleware,
    [param('id').isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const claim = await claimService.submitClaim(req.params.id, req.user!.id)
            res.json(claim)
        } catch (error) {
            next(error)
        }
    }
)

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
            const isAdmin = req.user!.role === 'admin' || req.user!.role === 'ADMIN'
            const claim = await claimService.approveClaim(
                req.params.id,
                req.user!.id,
                req.body.comment,
                isAdmin
            )
            res.json(claim)
        } catch (error) {
            next(error)
        }
    }
)

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
            res.json(claim)
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
            res.json(claim)
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
            res.json(claim)
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
            res.status(201).json(item)
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
            res.json({ success: true, message: '明细已删除' })
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
                return res.status(400).json({ error: '请上传收据文件' })
            }

            const receiptUrl = `/uploads/receipts/${req.file.filename}`
            const item = await claimService.uploadReceipt(
                req.params.itemId,
                receiptUrl,
                req.file.originalname
            )
            res.json(item)
        } catch (error) {
            next(error)
        }
    }
)

export default router
