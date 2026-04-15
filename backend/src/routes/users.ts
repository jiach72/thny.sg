import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { authMiddleware, requireRole } from '../middlewares/auth.js'
import { validate, NotFoundError } from '../middlewares/index.js'
import { prisma } from '../config/index.js'
import bcrypt from 'bcryptjs'
import { sendSuccess, sendError, success } from '../utils/responseHelper.js'
import logger from '../config/logger.js'

const router = Router()

// 所有用户管理路由需要认证且仅限 ADMIN 或 MANAGER
router.use(authMiddleware)
router.use(requireRole('ADMIN', 'MANAGER'))

/**
 * 获取用户列表
 * GET /api/v1/users
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search, roleCode, status } = req.query

        const where: any = {}

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } },
            ]
        }

        if (roleCode) {
            where.role = { code: roleCode }
        } else {
            // 默认排除 CUSTOMER 角色，仅显示内部员工
            where.role = { code: { not: 'CUSTOMER' } }
        }

        if (status) {
            where.status = status
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                roleId: true,
                role: { select: { id: true, code: true, name: true } },
                department: true,
                status: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        })

        sendSuccess(res, users)
    } catch (error) {
        next(error)
    }
})

/**
 * 获取单个用户
 * GET /api/v1/users/:id
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                name: true,
                email: true,
                roleId: true,
                role: { select: { id: true, code: true, name: true } },
                department: true,
                status: true,
                createdAt: true,
            },
        })

        if (!user) {
            return sendError(res, '用户不存在', 404)
        }

        sendSuccess(res, user)
    } catch (error) {
        next(error)
    }
})

/**
 * 创建用户
 * POST /api/v1/users
 */
router.post('/', requireRole('ADMIN'),
    [
        body('name').notEmpty().withMessage('用户名不能为空'),
        body('email').isEmail().withMessage('请提供有效的邮箱'),
        body('password').notEmpty().isLength({min:6}).withMessage('密码至少6个字符'),
        body('roleCode').optional().isString(),
        body('phone').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password, roleId, department } = req.body

        if (!name || !email || !roleId) {
            return sendError(res, '姓名、邮箱和角色为必填项', 400)
        }

        // 检查邮箱是否已存在
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return sendError(res, '该邮箱已被注册', 409)
        }

        let passwordHash: string
        let setupToken: string | null = null
        let setupTokenExpiry: Date | null = null

        if (password) {
            passwordHash = await bcrypt.hash(password, 12)
        } else {
            // 生成临时密码和 setupToken 以供邀请
            const crypto = await import('crypto')
            const tempPassword = crypto.randomBytes(16).toString('hex')
            passwordHash = await bcrypt.hash(tempPassword, 12)
            setupToken = crypto.randomBytes(32).toString('hex')
            setupTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天有效
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                roleId,
                department,
                setupToken,
                setupTokenExpiry,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: { select: { code: true, name: true } },
                setupToken: true,
            },
        })

        // 发送邀请邮件
        if (setupToken) {
            try {
                const { config } = await import('../config/index.js')
                const { emailTemplateService } = await import('../services/emailTemplateService.js')
                // 确保使用 management 端点 (origins[0] 通常是前端，[1] 可能是管理端，这里我们用更可靠的逻辑或者取环境变量)
                const adminUrl = process.env.VITE_ADMIN_URL || config.cors.origins.find(u => u.includes('admin') || u.includes('crm')) || 'http://localhost:5173'
                const setupUrl = `${adminUrl}/reset-password?token=${setupToken}`
                await emailTemplateService.sendEmail({
                    recipient: user.email,
                    subject: '通海南洋 — 邀请您加入系统',
                    body: `
                        <h2>欢迎加入通海南洋 CRM</h2>
                        <p>您好 ${user.name}，</p>
                        <p>管理员已为您创建了系统账号。请点击以下链接设置您的密码即可登录：</p>
                        <p><a href="${setupUrl}" style="background:#1e3a5f;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">设置密码</a></p>
                        <p>此链接将在 7 天后失效。</p>
                        <p>— 通海南洋团队</p>
                    `,
                })
            } catch (error) {
                logger.error('Failed to send invitation email:', error)
            }
        }

        res.status(201).json(success(user))
    } catch (error) {
        next(error)
    }
})

/**
 * 更新用户
 * PUT /api/v1/users/:id
 */
router.put('/:id',
    [
        body('name').optional().isString(),
        body('email').optional().isEmail(),
        body('phone').optional().isString(),
        body('roleCode').optional().isString(),
        body('status').optional().isIn(['ACTIVE','INACTIVE','SUSPENDED']),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, roleId, department, status } = req.body

        // 非 ADMIN 不能修改角色
        if (roleId && req.user?.role !== 'ADMIN') {
            return sendError(res, '仅管理员可修改用户角色', 403)
        }

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (roleId !== undefined) updateData.roleId = roleId
        if (department !== undefined) updateData.department = department
        if (status !== undefined) updateData.status = status

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: { select: { code: true, name: true } },
                department: true,
                status: true,
            },
        })

        sendSuccess(res, user)
    } catch (error: any) {
        // P2025: 记录不存在，转为 NotFoundError 交给全局错误处理
        if (error.code === 'P2025') {
            return next(new NotFoundError('用户不存在'))
        }
        next(error)
    }
})

export default router
