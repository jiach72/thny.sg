import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { authService } from '../services/index.js'
import { rbacService } from '../services/rbacService.js'
import { validate } from '../middlewares/index.js'
import { authMiddleware } from '../middlewares/index.js'

const router = Router()

/**
 * POST /auth/login - 用户登录
 */
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('请输入有效的邮箱地址'),
        body('password').notEmpty().withMessage('密码不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body
            const result = await authService.login({ email, password })
            res.json(result)
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
    [
        body('email').isEmail().withMessage('请输入有效的邮箱地址'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('密码至少需要8个字符'),
        body('name').notEmpty().withMessage('姓名不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password, name } = req.body
            const result = await authService.register({ email, password, name })
            res.status(201).json(result)
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
            res.json(result)
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
        res.json(user)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /auth/me/permissions - 获取当前用户的权限列表
 */
router.get('/me/permissions', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const permissions = await rbacService.getUserPermissions(req.user!.id)
        res.json({ data: permissions })
    } catch (error) {
        next(error)
    }
})

/**
 * POST /auth/logout - 用户登出
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
    // 客户端需要删除本地存储的 Token
    // 服务端可以选择加入 Token 黑名单 (需要 Redis)
    res.json({ success: true, message: '已成功登出' })
})

/**
 * GET /auth/setup-password/:token - 验证设置密码 Token
 */
router.get('/setup-password/:token', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.validateSetupToken(req.params.token)
        res.json(result)
    } catch (error) {
        next(error)
    }
})

/**
 * POST /auth/setup-password - 首次登录设置密码
 */
router.post(
    '/setup-password',
    [
        body('token').notEmpty().withMessage('Token 不能为空'),
        body('password').isLength({ min: 8 }).withMessage('密码至少需要8个字符'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { token, password } = req.body
            const result = await authService.setupPassword(token, password)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

export default router
