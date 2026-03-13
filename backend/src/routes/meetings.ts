import { Router, Request, Response, NextFunction } from 'express'
import { body, query, param } from 'express-validator'
import { meetingService } from '../services/meetingService.js'
import { validate, authMiddleware } from '../middlewares/index.js'

const router = Router()

// ==================== 会议纪要 ====================

// 获取即将到来的会议
router.get(
    '/upcoming',
    authMiddleware,
    [query('days').optional().isInt({ min: 1, max: 30 }).toInt()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const days = Number(req.query.days) || 7
            const meetings = await meetingService.getUpcomingMeetings(req.user!.id, days)
            res.json(meetings)
        } catch (error) {
            next(error)
        }
    }
)

// 获取会议纪要
router.get(
    '/:id/minutes',
    authMiddleware,
    [param('id').isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const minutes = await meetingService.getMeetingMinutes(req.params.id)
            res.json(minutes)
        } catch (error) {
            next(error)
        }
    }
)

// 创建/更新会议纪要
router.post(
    '/:id/minutes',
    authMiddleware,
    [
        param('id').isString(),
        body('content').notEmpty().withMessage('纪要内容不能为空'),
        body('actionItems').optional().isArray(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const minutes = await meetingService.upsertMeetingMinutes(
                req.params.id,
                req.body,
                req.user!.id
            )
            res.json(minutes)
        } catch (error) {
            next(error)
        }
    }
)

// ==================== 会议室管理 ====================

// 获取会议室列表（活跃的）
router.get(
    '/rooms',
    authMiddleware,
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const rooms = await meetingService.getMeetingRooms()
            res.json(rooms)
        } catch (error) {
            next(error)
        }
    }
)

// 获取所有会议室（管理页面用，含非活跃）
router.get(
    '/rooms/all',
    authMiddleware,
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const rooms = await meetingService.getAllMeetingRooms()
            res.json(rooms)
        } catch (error) {
            next(error)
        }
    }
)

// 创建会议室
router.post(
    '/rooms',
    authMiddleware,
    [
        body('name').notEmpty().withMessage('会议室名称不能为空'),
        body('capacity').optional().isInt({ min: 1 }),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const room = await meetingService.createMeetingRoom(req.body)
            res.status(201).json(room)
        } catch (error) {
            next(error)
        }
    }
)

// 更新会议室
router.put(
    '/rooms/:id',
    authMiddleware,
    [param('id').isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const room = await meetingService.updateMeetingRoom(req.params.id, req.body)
            res.json(room)
        } catch (error) {
            next(error)
        }
    }
)

// 删除会议室
router.delete(
    '/rooms/:id',
    authMiddleware,
    [param('id').isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await meetingService.deleteMeetingRoom(req.params.id)
            res.json({ success: true, message: '会议室已停用' })
        } catch (error) {
            next(error)
        }
    }
)

// ==================== 报销分类配置 ====================

// 获取分类列表
router.get(
    '/expense-categories',
    authMiddleware,
    [query('all').optional().isBoolean().toBoolean()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const activeOnly = !req.query.all
            const configs = await meetingService.getExpenseCategoryConfigs(activeOnly)
            res.json(configs)
        } catch (error) {
            next(error)
        }
    }
)

// 创建分类
router.post(
    '/expense-categories',
    authMiddleware,
    [
        body('code').notEmpty().withMessage('分类编码不能为空'),
        body('name').notEmpty().withMessage('分类名称不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const config = await meetingService.createExpenseCategoryConfig(req.body)
            res.status(201).json(config)
        } catch (error) {
            next(error)
        }
    }
)

// 更新分类
router.put(
    '/expense-categories/:id',
    authMiddleware,
    [param('id').isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const config = await meetingService.updateExpenseCategoryConfig(req.params.id, req.body)
            res.json(config)
        } catch (error) {
            next(error)
        }
    }
)

// 删除分类
router.delete(
    '/expense-categories/:id',
    authMiddleware,
    [param('id').isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await meetingService.deleteExpenseCategoryConfig(req.params.id)
            res.json({ success: true, message: '分类已停用' })
        } catch (error) {
            next(error)
        }
    }
)

export default router
