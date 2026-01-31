import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { customerAuth, validate } from '../middlewares/index.js'
import portalService from '../services/portalService.js'

const router = Router()

/**
 * GET /portal/profile - 获取客户个人资料
 */
router.get('/profile', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const profile = await portalService.getProfile(req.user!.id)
        res.json(profile)
    } catch (error) {
        next(error)
    }
})

/**
 * PUT /portal/profile - 更新客户个人资料
 */
router.put(
    '/profile',
    customerAuth,
    [
        body('name').optional().isString(),
        body('phone').optional().isString(),
        body('company').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await portalService.updateProfile(req.user!.id, req.body)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /portal/change-password - 修改密码
 */
router.post(
    '/change-password',
    customerAuth,
    [
        body('currentPassword').notEmpty().withMessage('请输入当前密码'),
        body('newPassword').isLength({ min: 8 }).withMessage('新密码至少8个字符'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await portalService.changePassword(req.user!.id, req.body)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /portal/projects - 获取客户的项目列表
 */
router.get('/projects', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const projects = await portalService.getMyProjects(req.user!.id)
        res.json(projects)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /portal/projects/:id - 获取项目详情
 */
router.get('/projects/:id', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const project = await portalService.getProjectDetail(req.user!.id, req.params.id)
        res.json(project)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /portal/notifications - 获取待办/通知
 */
router.get('/notifications', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notifications = await portalService.getNotifications(req.user!.id)
        res.json(notifications)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /portal/dashboard - 获取仪表板统计
 */
router.get('/dashboard', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await portalService.getDashboardStats(req.user!.id)
        res.json(stats)
    } catch (error) {
        next(error)
    }
})

// ==================== 站内消息接口 ====================
import messageService from '../services/messageService.js'

/**
 * GET /portal/messages - 获取站内消息列表
 */
router.get('/messages', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 20
        const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined
        const type = req.query.type as string | undefined

        const result = await messageService.getMessages(req.user!.id, { isRead, type }, page, limit)
        res.json(result)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /portal/messages/unread-count - 获取未读消息数量
 */
router.get('/messages/unread-count', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await messageService.getUnreadCount(req.user!.id)
        res.json(result)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /portal/messages/:id - 获取消息详情
 */
router.get('/messages/:id', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const message = await messageService.getById(req.params.id, req.user!.id)
        res.json(message)
    } catch (error) {
        next(error)
    }
})

/**
 * PUT /portal/messages/:id/read - 标记消息为已读
 */
router.put('/messages/:id/read', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await messageService.markAsRead(req.params.id, req.user!.id)
        res.json(result)
    } catch (error) {
        next(error)
    }
})

/**
 * POST /portal/messages/mark-all-read - 全部标记为已读
 */
router.post('/messages/mark-all-read', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await messageService.markAllAsRead(req.user!.id)
        res.json(result)
    } catch (error) {
        next(error)
    }
})

/**
 * DELETE /portal/messages/:id - 删除消息
 */
router.delete('/messages/:id', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await messageService.delete(req.params.id, req.user!.id)
        res.json(result)
    } catch (error) {
        next(error)
    }
})

export default router
