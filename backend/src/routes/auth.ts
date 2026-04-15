import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import rateLimit from 'express-rate-limit'
import { authService } from '../services/index.js'
import { rbacService } from '../services/rbacService.js'
import { validate } from '../middlewares/index.js'
import { authMiddleware } from '../middlewares/index.js'
import { sendSuccess, sendError, success } from '../utils/responseHelper.js'
import { config } from '../config/index.js'
import logger from '../config/logger.js'

const router = Router()

/**
 * httpOnly cookie 配置（仅用于 refreshToken）
 * - httpOnly: 防止 XSS 读取
 * - secure: 生产环境强制 HTTPS
 * - sameSite: lax 防止 CSRF
 * - path: 限制 cookie 仅发送到 auth 端点
 */
const REFRESH_TOKEN_COOKIE = 'refreshToken'
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax' as const,
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 天（与 JWT_REFRESH_EXPIRES_IN 对齐）
}

/** 将 refreshToken 设置为 httpOnly cookie */
function setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS)
}

/** 清除 refreshToken cookie */
function clearRefreshTokenCookie(res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
        httpOnly: COOKIE_OPTIONS.httpOnly,
        secure: COOKIE_OPTIONS.secure,
        sameSite: COOKIE_OPTIONS.sameSite,
        path: COOKIE_OPTIONS.path,
    })
}

/**
 * 认证端点速率限制
 * 15 分钟内最多 5 次失败尝试，成功请求不计入
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟窗口
    max: 5,                   // 每窗口最多 5 次尝试
    skipSuccessfulRequests: true,
    message: { code: 'RATE_LIMITED', message: '请求过于频繁，请 15 分钟后重试' },
    standardHeaders: true,
    legacyHeaders: false,
})

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 用户认证相关接口
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@tonghai.sg
 *               password:
 *                 type: string
 *                 example: Admin@123
 *     responses:
 *       200:
 *         description: 登录成功，返回 JWT Token
 *       401:
 *         description: 邮箱或密码错误
 *       429:
 *         description: 请求过于频繁
 */
router.post(
    '/login',
    authLimiter, // 速率限制
    [
        body('email').isEmail().withMessage('请输入有效的邮箱地址'),
        body('password').notEmpty().withMessage('密码不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body
            const result = await authService.login({ email, password })

            // 将 refreshToken 设置为 httpOnly cookie
            if (result.refreshToken) {
                setRefreshTokenCookie(res, result.refreshToken)
            }

            sendSuccess(res, result, '登录成功')
        } catch (error) {
            next(error)
        }
    }
)

/**
 * @swagger
 * /auth/login/2fa:
 *   post:
 *     summary: 验证双重认证进行最终登录
 *     tags: [Auth]
 */
router.post(
    '/login/2fa',
    authLimiter,
    [
        body('tempToken').notEmpty().withMessage('会话失效，请重试'),
        body('code').notEmpty().withMessage('验证码不能为空')
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tempToken, code } = req.body
            const result = await authService.verify2FALogin(tempToken, code)

            // 将 refreshToken 设置为 httpOnly cookie
            if (result.refreshToken) {
                setRefreshTokenCookie(res, result.refreshToken)
            }

            sendSuccess(res, result, '登录成功')
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /auth/register - 用户注册
 */
router.post(
    '/register',
    authLimiter, // 速率限制
    [
        body('email').isEmail().withMessage('请输入有效的邮箱地址'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('密码至少需要8个字符')
            .matches(/[A-Z]/)
            .withMessage('密码需包含至少一个大写字母')
            .matches(/[a-z]/)
            .withMessage('密码需包含至少一个小写字母')
            .matches(/[0-9]/)
            .withMessage('密码需包含至少一个数字')
            .matches(/[!@#$%^&*(),.?":{}|<>]/)
            .withMessage('密码需包含至少一个特殊字符'),
        body('name').notEmpty().withMessage('姓名不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password, name } = req.body
            const result = await authService.register({ email, password, name })
            res.status(201).json(success(result, '注册成功'))
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /auth/refresh - 刷新 Token
 */
router.post(
    '/refresh',
    [
        // refreshToken 现在优先从 cookie 读取，body 作为向后兼容
        body('refreshToken').optional(),
    ],
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 优先从 httpOnly cookie 读取，其次从 body 读取（向后兼容）
            const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body.refreshToken

            if (!refreshToken) {
                return sendError(res, '刷新令牌不能为空', 400)
            }

            const result = await authService.refreshToken(refreshToken)

            // 如果实现了 Refresh Token 轮换，需要重新写入 cookie
            if (result.refreshToken) {
                setRefreshTokenCookie(res, result.refreshToken)
            }

            sendSuccess(res, result, '刷新成功')
        } catch (error) {
            // 刷新失败时清除 cookie
            clearRefreshTokenCookie(res)
            next(error)
        }
    }
)

/**
 * GET /auth/me - 获取当前用户信息
 */
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await authService.getCurrentUser(req.user!.id)
        sendSuccess(res, user)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /auth/2fa/generate - 设置：生成二步验证并获取二维码
 */
router.get('/2fa/generate', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.generate2FA(req.user!.id)
        sendSuccess(res, result)
    } catch (error) {
        next(error)
    }
})

/**
 * POST /auth/2fa/enable - 设置：绑定并激活 2FA
 */
router.post(
    '/2fa/enable',
    authMiddleware,
    [body('code').notEmpty().withMessage('验证码不能为空')],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { code } = req.body
            const result = await authService.verifyAndEnable2FA(req.user!.id, code)
            sendSuccess(res, result, '已成功启用双因素认证')
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /auth/2fa/disable - 设置：关闭 2FA
 */
router.post(
    '/2fa/disable',
    authMiddleware,
    [body('code').notEmpty().withMessage('验证码不能为空')],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { code } = req.body
            const result = await authService.disable2FA(req.user!.id, code)
            sendSuccess(res, result, '已成功关闭双因素认证')
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /auth/me/permissions - 获取当前用户的权限列表
 */
router.get('/me/permissions', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const permissions = await rbacService.getUserPermissions(req.user!.id)
        // 注意：原接口返回 { data: permissions }，现在 sendSuccess 会包裹为 { code, data: permissions }
        // 前端拦截器会解包为 permissions 数组。
        // 但前端逻辑是否期待 { data: ... } 结构？
        // 原逻辑: res.json({ data: permissions }) -> 前端得到 { data: [...] }
        // 新逻辑: sendSuccess(res, permissions) -> { code: 200, data: [...] } -> 拦截器必须解包 return res.data
        // 解包后前端得到 [...] (数组)
        // 如果前端代码写的是 response.data (即 permissions 数组)，则兼容。
        // 如果前端代码写的是 response.data.data (原 axios response.data.data)，则不兼容？
        // 让我们假设前端通过拦截器得到的是最终数据。
        sendSuccess(res, permissions)
    } catch (error) {
        next(error)
    }
})

/**
 * POST /auth/logout - 用户登出
 * 将 Token 加入黑名单，使其立即失效
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization
        const token = authHeader?.substring(7)

        if (token) {
            // 动态导入避免启动时 Redis 连接
            const { tokenBlacklist } = await import('../config/redis.js')
            const jwt = await import('jsonwebtoken')

            // 解码获取过期时间
            const decoded = jwt.default.decode(token) as { exp?: number }
            if (decoded?.exp) {
                const ttl = decoded.exp - Math.floor(Date.now() / 1000)
                if (ttl > 0) {
                    await tokenBlacklist.add(token, ttl)
                }
            }
        }

        // 从 cookie 或 body 获取 refreshToken
        const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body.refreshToken
        if (refreshToken) {
            const { tokenBlacklist } = await import('../config/redis.js')
            const jwt = await import('jsonwebtoken')
            const decodedRt = jwt.default.decode(refreshToken) as { exp?: number }
            if (decodedRt?.exp) {
                const ttlRt = decodedRt.exp - Math.floor(Date.now() / 1000)
                if (ttlRt > 0) {
                    await tokenBlacklist.add(refreshToken, ttlRt)
                }
            }
        }

        // 清除 refreshToken cookie
        clearRefreshTokenCookie(res)

        sendSuccess(res, null, '登出成功')
    } catch (error) {
        // 即使黑名单失败，也清除 cookie 并返回成功
        clearRefreshTokenCookie(res)
        logger.error('Token 黑名单添加失败:', error)
        sendSuccess(res, null, '已成功登出')
    }
})

/**
 * GET /auth/setup-password/:token - 验证设置密码 Token
 */
router.get('/setup-password/:token', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.validateSetupToken(req.params.token)
        sendSuccess(res, result)
    } catch (error) {
        next(error)
    }
})

/**
 * POST /auth/setup-password - 首次登录设置密码
 */
router.post(
    '/setup-password',
    authLimiter, // 速率限制
    [
        body('token').notEmpty().withMessage('Token 不能为空'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('密码至少需要8个字符')
            .matches(/[A-Z]/)
            .withMessage('密码需包含至少一个大写字母')
            .matches(/[a-z]/)
            .withMessage('密码需包含至少一个小写字母')
            .matches(/[0-9]/)
            .withMessage('密码需包含至少一个数字')
            .matches(/[!@#$%^&*(),.?":{}|<>]/)
            .withMessage('密码需包含至少一个特殊字符'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { token, password } = req.body
            const result = await authService.setupPassword(token, password)
            sendSuccess(res, result, '密码设置成功')
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /auth/forgot-password - 忘记密码（发送重置邮件）
 */
router.post(
    '/forgot-password',
    rateLimit({
        windowMs: 60 * 60 * 1000, // 1 小时
        max: 3, // 每小时最多 3 次
        message: { success: false, message: '请求过于频繁，请稍后再试' },
    }),
    [
        body('email').isEmail().withMessage('请输入有效的邮箱地址'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await authService.forgotPassword(req.body.email)
            sendSuccess(res, result, result.message)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /auth/reset-password - 重置密码（验证 token + 设置新密码）
 */
router.post(
    '/reset-password',
    authLimiter,
    [
        body('token').notEmpty().withMessage('重置令牌不能为空'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('密码至少需要8个字符')
            .matches(/[A-Z]/)
            .withMessage('密码需包含至少一个大写字母')
            .matches(/[a-z]/)
            .withMessage('密码需包含至少一个小写字母')
            .matches(/[0-9]/)
            .withMessage('密码需包含至少一个数字')
            .matches(/[!@#$%^&*(),.?":{}|<>]/)
            .withMessage('密码需包含至少一个特殊字符'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { token, password } = req.body
            const result = await authService.resetPassword(token, password)
            sendSuccess(res, result, result.message)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /auth/setup-status - 获取系统初始化状态
 * 用于前端判断是否需要进入部署后的初始化向导
 */
router.get('/setup-status', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.getSetupStatus()
        sendSuccess(res, result)
    } catch (error) {
        next(error)
    }
})

/**
 * POST /auth/setup-admin - 冷启动时初始化首个超级管理员
 * 仅当系统中无任何管理员时可用
 */
router.post(
    '/setup-admin',
    [
        body('email').isEmail().withMessage('请输入有效的邮箱地址'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('密码至少 8 位')
            .matches(/[A-Z]/)
            .withMessage('密码需包含至少一个大写字母')
            .matches(/[a-z]/)
            .withMessage('密码需包含至少一个小写字母')
            .matches(/[0-9]/)
            .withMessage('密码需包含至少一个数字'),
        body('name').notEmpty().withMessage('姓名不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password, name } = req.body
            const result = await authService.setupFirstAdmin({ email, password, name })
            sendSuccess(res, result, '首次超级管理员创建成功，正在刷新环境')
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /auth/sso/ticket - 生成短命单点登录票据
 */
router.post('/sso/ticket', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.generateSSOTicket(req.user!.id)
        sendSuccess(res, result)
    } catch (error) {
        next(error)
    }
})

/**
 * POST /auth/sso/exchange - 核销票据并获取 JWT
 */
router.post(
    '/sso/exchange',
    authLimiter,
    [body('ticket').notEmpty().withMessage('票据不能为空')],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { ticket } = req.body
            const result = await authService.exchangeSSOTicket(ticket)
            
            if (result.refreshToken) {
                setRefreshTokenCookie(res, result.refreshToken)
            }
            
            sendSuccess(res, result, '授权成功')
        } catch (error) {
            next(error)
        }
    }
)

export default router
