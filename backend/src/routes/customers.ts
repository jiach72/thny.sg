import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { authMiddleware, adminAuth, validate } from '../middlewares/index.js'
import { customerService } from '../services/customerService.js'
import { NotFoundError } from '../middlewares/errorHandler.js'
import { familyMemberRepository } from '../repositories/FamilyMemberRepository.js'
import { sendSuccess } from '../utils/responseHelper.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../config/index.js'
import logger from '../config/logger.js'

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

/**
 * POST /customers — 手动创建客户（含用户账号）
 */
router.post(
    '/',
    [
        body('contactName').notEmpty().withMessage('客户姓名不能为空'),
        body('email').isEmail().withMessage('请提供有效的邮箱'),
        body('phone').optional().isString(),
        body('companyName').optional().isString(),
        body('password').optional().isLength({ min: 6 }).withMessage('密码至少6个字符'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { contactName, email, phone, companyName, password } = req.body

            // 检查邮箱是否已注册
            const existingUser = await prisma.user.findUnique({ where: { email } })
            if (existingUser) {
                return res.status(409).json({ code: 409, message: '该邮箱已被注册' })
            }

            // 获取 CUSTOMER 角色
            const customerRole = await prisma.role.findUnique({ where: { code: 'CUSTOMER' } })
            if (!customerRole) {
                return res.status(500).json({ code: 500, message: '系统配置错误: CUSTOMER 角色不存在' })
            }

            // 创建用户账号
            let passwordHash: string
            let setupToken: string | null = null
            let setupTokenExpiry: Date | null = null

            if (password) {
                passwordHash = await bcrypt.hash(password, 12)
            } else {
                // 无密码时生成临时密码和 setupToken
                const tempPassword = crypto.randomBytes(16).toString('hex')
                passwordHash = await bcrypt.hash(tempPassword, 12)
                setupToken = crypto.randomBytes(32).toString('hex')
                setupTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天有效
            }

            const user = await prisma.user.create({
                data: {
                    name: contactName,
                    email,
                    passwordHash,
                    roleId: customerRole.id,
                    setupToken,
                    setupTokenExpiry,
                },
            })

            // 创建线索
            const lead = await prisma.lead.create({
                data: {
                    contactName,
                    email,
                    phone: phone || null,
                    companyName: companyName || null,
                    sourceChannel: 'manual',
                    status: 'CONVERTED',
                },
            })

            // 创建客户并关联用户和线索
            const customer = await prisma.customer.create({
                data: {
                    leadId: lead.id,
                    userId: user.id,
                    contactName,
                    email,
                    phone: phone || null,
                    companyName: companyName || null,
                },
                include: {
                    lead: {
                        select: {
                            contactName: true,
                            companyName: true,
                            email: true,
                            phone: true,
                            sourceChannel: true,
                        },
                    },
                    user: { select: { id: true, name: true, email: true, status: true } },
                },
            })

            // 发送邀请邮件（无密码时）
            if (setupToken) {
                try {
                    const { config } = await import('../config/index.js')
                    const { emailTemplateService } = await import('../services/emailTemplateService.js')
                    const adminUrl = process.env.VITE_ADMIN_URL || config.cors.origins.find((u: string) => u.includes('admin') || u.includes('crm')) || 'http://localhost:5173'
                    const setupUrl = `${adminUrl}/reset-password?token=${setupToken}`
                    await emailTemplateService.sendEmail({
                        recipient: user.email,
                        subject: '通海南洋 — 欢迎注册',
                        body: `
                            <h2>欢迎加入通海南洋</h2>
                            <p>您好 ${contactName}，</p>
                            <p>管理员已为您创建了系统账号。请点击以下链接设置您的密码即可登录：</p>
                            <p><a href="${setupUrl}" style="background:#1e3a5f;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">设置密码</a></p>
                            <p>此链接将在 7 天后失效。</p>
                            <p>— 通海南洋团队</p>
                        `,
                    })
                } catch (error) {
                    logger.error('发送客户邀请邮件失败:', error)
                }
            }

            sendSuccess(res, customer, '客户创建成功')
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /customers/:id/reset-password — 管理员重置客户密码
 */
router.post(
    '/:id/reset-password',
    [
        body('newPassword').optional().isLength({ min: 8 }).withMessage('密码至少8位'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { newPassword } = req.body
            const customerId = req.params.id

            // 查找客户及其关联用户
            const customer = await prisma.customer.findUnique({
                where: { id: customerId },
                include: { user: true },
            })

            if (!customer) {
                throw new NotFoundError('客户不存在')
            }

            if (!customer.user) {
                return res.status(400).json({ code: 400, message: '该客户未关联用户账号' })
            }

            const user = customer.user

            if (newPassword) {
                // 直接设置新密码
                const passwordHash = await bcrypt.hash(newPassword, 12)
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        passwordHash,
                        setupToken: null,
                        setupTokenExpiry: null,
                    },
                })
                sendSuccess(res, null, '密码已重置')
            } else {
                // 生成 setupToken 发送重置邮件
                const resetToken = crypto.randomBytes(32).toString('hex')
                const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时有效

                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        setupToken: resetToken,
                        setupTokenExpiry: expiry,
                    },
                })

                // 发送重置邮件
                try {
                    const { config } = await import('../config/index.js')
                    const { emailTemplateService } = await import('../services/emailTemplateService.js')
                    const resetUrl = `${config.managementUrl}/reset-password?token=${resetToken}`
                    await emailTemplateService.sendEmail({
                        recipient: user.email,
                        subject: '通海南洋 — 密码重置',
                        body: `
                            <h2>密码重置</h2>
                            <p>您好 ${user.name}，</p>
                            <p>管理员已为您发起密码重置。请点击以下链接设置新密码：</p>
                            <p><a href="${resetUrl}" style="background:#1e3a5f;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">重置密码</a></p>
                            <p>此链接将在 24 小时后失效。</p>
                            <p>— 通海南洋团队</p>
                        `,
                    })
                } catch (error) {
                    logger.error('发送密码重置邮件失败:', error)
                }

                sendSuccess(res, null, '重置邮件已发送')
            }
        } catch (error) {
            next(error)
        }
    }
)

export default router
