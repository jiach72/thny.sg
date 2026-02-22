import { Router, Request, Response, NextFunction } from 'express'
import { body, query } from 'express-validator'
import { authMiddleware, validate } from '../middlewares/index.js'
import { customerService } from '../services/customerService.js'
import { NotFoundError } from '../middlewares/errorHandler.js'

const router = Router()

router.use(authMiddleware)

/**
 * GET /customers — 客户列表（分页 + 搜索 + 筛选）
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await customerService.getCustomerList({
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
            search: req.query.search as string,
            kycStatus: req.query.kycStatus as string,
            riskGrade: req.query.riskGrade as string,
            sourceChannel: req.query.sourceChannel as string,
            assignedToId: req.query.assignedToId as string,
            sortBy: req.query.sortBy as string,
            sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        })
        res.json(result)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /customers/stats — 统计卡片
 */
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await customerService.getStats()
        res.json(stats)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /customers/options — 下拉选项列表（保留兼容）
 */
router.get('/options', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search } = req.query as { search?: string }
        const customers = await customerService.getConnectList(search)
        res.json(customers)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /customers/:id — 客户详情
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customer = await customerService.getCustomerById(req.params.id)
        if (!customer) {
            throw new NotFoundError('客户不存在')
        }
        res.json(customer)
    } catch (error) {
        next(error)
    }
})

/**
 * PUT /customers/:id — 更新客户信息/画像
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customer = await customerService.updateCustomer(req.params.id, req.body)
        res.json(customer)
    } catch (error) {
        next(error)
    }
})

/**
 * PUT /customers/:id/kyc — 更新 KYC 状态
 */
router.put(
    '/:id/kyc',
    [
        body('kycStatus').isIn(['PENDING', 'APPROVED', 'REJECTED', 'REVIEW']).withMessage('无效的 KYC 状态'),
        body('riskGrade').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const customer = await customerService.updateKycStatus(
                req.params.id,
                req.body.kycStatus,
                req.body.riskGrade
            )
            res.json(customer)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /customers/:id/timeline — 互动时间线
 */
router.get('/:id/timeline', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const timeline = await customerService.getTimeline(req.params.id)
        res.json(timeline)
    } catch (error) {
        next(error)
    }
})

/**
 * PUT /customers/:id/family — 更新家庭成员
 */
router.put('/:id/family', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customer = await customerService.updateCustomer(req.params.id, {
            familyMembers: req.body.familyMembers,
        })
        res.json(customer)
    } catch (error) {
        next(error)
    }
})

/**
 * PUT /customers/:id/notes — 更新顾问备注
 */
router.put('/:id/notes', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customer = await customerService.updateCustomer(req.params.id, {
            profileNotes: req.body.profileNotes,
        })
        res.json(customer)
    } catch (error) {
        next(error)
    }
})

export default router
