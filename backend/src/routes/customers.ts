import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { authMiddleware, adminAuth, validate } from '../middlewares/index.js'
import { customerService } from '../services/customerService.js'
import { NotFoundError } from '../middlewares/errorHandler.js'
import { familyMemberRepository } from '../repositories/FamilyMemberRepository.js'
import { sendSuccess } from '../utils/responseHelper.js'

const router = Router()

// 客户管理路由仅限管理端用户（排除 CUSTOMER 角色）
router.use(authMiddleware)
router.use(adminAuth)

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
            tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags as string[] : [req.query.tags as string]) : undefined,
            sortBy: req.query.sortBy as string,
            sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        })
        sendSuccess(res, result)
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
        sendSuccess(res, stats)
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
        sendSuccess(res, customers)
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
        sendSuccess(res, customer)
    } catch (error) {
        next(error)
    }
})

/**
 * PUT /customers/:id — 更新客户信息/画像
 */
router.put(
    '/:id',
    [
        body('name').optional().isString(),
        body('email').optional().isEmail(),
        body('phone').optional().isString(),
        body('company').optional().isString(),
        body('source').optional().isString(),
        body('tags').optional().isArray(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customer = await customerService.updateCustomer(req.params.id, req.body)
        sendSuccess(res, customer)
    } catch (error) {
        next(error)
    }
})

/**
 * PUT /customers/kyc/batch — 批量更新 KYC 状态
 */
router.put(
    '/kyc/batch',
    [
        body('ids').isArray({ min: 1 }).withMessage('请提供要更新的客户 ID 列表'),
        body('kycStatus').isIn(['PENDING', 'APPROVED', 'REJECTED', 'REVIEW']).withMessage('无效的 KYC 状态'),
        body('riskGrade').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { ids, kycStatus, riskGrade } = req.body
            const result = await customerService.batchUpdateKycStatus(ids, kycStatus, riskGrade)
            sendSuccess(res, { count: result.count })
        } catch (error) {
            next(error)
        }
    }
)

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
            sendSuccess(res, customer)
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
        sendSuccess(res, timeline)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /customers/:id/family — 获取家庭成员列表
 */
router.get('/:id/family', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const members = await familyMemberRepository.findByCustomerId(req.params.id)
        sendSuccess(res, { members })
    } catch (error) {
        next(error)
    }
})

/**
 * POST /customers/:id/family — 添加家庭成员
 */
router.post(
    '/:id/family',
    [
        body('name').isString().trim().notEmpty().withMessage('姓名不能为空'),
        body('relationship').isString().trim().notEmpty().withMessage('关系不能为空'),
        body('isBeneficiary').optional().isBoolean(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const member = await familyMemberRepository.create({
                customer: { connect: { id: req.params.id } },
                name: req.body.name,
                relationship: req.body.relationship,
                isBeneficiary: req.body.isBeneficiary || false,
            })
            sendSuccess(res, { member })
        } catch (error) {
            next(error)
        }
    }
)

/**
 * PUT /customers/:id/family/:memberId — 更新家庭成员
 */
router.put(
    '/:id/family/:memberId',
    [
        body('name').optional().isString().trim().notEmpty(),
        body('relationship').optional().isString().trim().notEmpty(),
        body('isBeneficiary').optional().isBoolean(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const existing = await familyMemberRepository.findByCustomerAndMemberId(
                req.params.id,
                req.params.memberId
            )
            if (!existing) {
                throw new NotFoundError('成员不存在')
            }
            const member = await familyMemberRepository.update(req.params.memberId, req.body)
            sendSuccess(res, { member })
        } catch (error) {
            next(error)
        }
    }
)

/**
 * DELETE /customers/:id/family/:memberId — 删除家庭成员
 */
router.delete('/:id/family/:memberId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const existing = await familyMemberRepository.findByCustomerAndMemberId(
            req.params.id,
            req.params.memberId
        )
        if (!existing) {
            throw new NotFoundError('成员不存在')
        }
        await familyMemberRepository.softDelete(req.params.memberId)
        sendSuccess(res, null, '成员已删除')
    } catch (error) {
        next(error)
    }
})

/**
 * PUT /customers/:id/notes — 更新顾问备注
 */
router.put(
    '/:id/notes',
    [body('profileNotes').optional().isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customer = await customerService.updateCustomer(req.params.id, {
            profileNotes: req.body.profileNotes,
        })
        sendSuccess(res, customer)
    } catch (error) {
        next(error)
    }
})

/**
 * POST /customers/:id/auto-tags — 计算并重新分配客户画像标签
 */
router.post('/:id/auto-tags', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tags = await customerService.autoAssignTags(req.params.id)
        sendSuccess(res, { tags })
    } catch (error) {
        next(error)
    }
})

/**
 * GET /customers/export — 导出客户列表为 CSV
 */
router.get('/export', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await customerService.getCustomerList({
            page: 1,
            limit: 50000,
            search: req.query.search as string,
            kycStatus: req.query.kycStatus as string,
            riskGrade: req.query.riskGrade as string,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        })

        // BOM + CSV 头
        const BOM = '\uFEFF'
        const headers = ['客户名称', '邮箱', '电话', '公司', '来源渠道', 'KYC 状态', '风险等级', '服务类型', '创建日期']

        const escapeCSV = (val: string | null | undefined): string => {
            if (val == null) return ''
            const str = String(val)
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`
            }
            return str
        }

        const rows = (result.data || []).map((c: any) => [
            escapeCSV(c.name),
            escapeCSV(c.email),
            escapeCSV(c.phone),
            escapeCSV(c.companyName),
            escapeCSV(c.sourceChannel),
            escapeCSV(c.kycStatus),
            escapeCSV(c.riskGrade),
            escapeCSV(Array.isArray(c.serviceTypes) ? c.serviceTypes.join('; ') : c.serviceTypes),
            c.createdAt ? new Date(c.createdAt).toLocaleDateString('zh-CN') : '',
        ].join(','))

        const csv = BOM + headers.join(',') + '\n' + rows.join('\n')

        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.setHeader('Content-Disposition', `attachment; filename="customers_${new Date().toISOString().slice(0, 10)}.csv"`)
        res.send(csv)
    } catch (error) {
        next(error)
    }
})

export default router
