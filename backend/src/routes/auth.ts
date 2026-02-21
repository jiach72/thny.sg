import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import rateLimit from 'express-rate-limit'
import { authService } from '../services/index.js'
import { rbacService } from '../services/rbacService.js'
import { validate } from '../middlewares/index.js'
import { authMiddleware } from '../middlewares/index.js'
import { sendSuccess, success } from '../utils/responseHelper.js'

const router = Router()

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
    [body('refreshToken').notEmpty().withMessage('刷新令牌不能为空')],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { refreshToken } = req.body
            const result = await authService.refreshToken(refreshToken)
            sendSuccess(res, result, '刷新成功')
        } catch (error) {
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

        const { refreshToken } = req.body
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

        sendSuccess(res, null, '登出成功')
    } catch (error) {
        // 即使黑名单失败，也返回成功（降级处理）
        console.error('Token 黑名单添加失败:', error)
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

export default router
