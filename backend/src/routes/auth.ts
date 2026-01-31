import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { authService } from '../services/index.js'
import { rbacService } from '../services/rbacService.js'
import { validate } from '../middlewares/index.js'
import { authMiddleware } from '../middlewares/index.js'
import { sendSuccess, success } from '../utils/responseHelper.js'

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
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
    // 客户端需要删除本地存储的 Token
    // 服务端可以选择加入 Token 黑名单 (需要 Redis)
    sendSuccess(res, null, '已成功登出')
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
    [
        body('token').notEmpty().withMessage('Token 不能为空'),
        body('password').isLength({ min: 8 }).withMessage('密码至少需要8个字符'),
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
