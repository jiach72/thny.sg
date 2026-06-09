import { Router, Request, Response, NextFunction } from 'express'
import { body, query, param } from 'express-validator'
import { meetingService } from '../services/meetingService.js'
import { validate, authMiddleware, adminAuth } from '../middlewares/index.js'
import { sendSuccess, success } from '../utils/responseHelper.js'

const router = Router()

router.use(authMiddleware, adminAuth)

router.get(
    '/upcoming',
    [query('days').optional().isInt({ min: 1, max: 30 }).toInt()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const days = Number(req.query.days) || 7
            const meetings = await meetingService.getUpcomingMeetings(req.user!.id, days)
            sendSuccess(res, meetings)
        } catch (error) {
            next(error)
        }
    }
)

router.get(
    '/:id/minutes',
    [param('id').isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const minutes = await meetingService.getMeetingMinutes(req.params.id)
            sendSuccess(res, minutes)
        } catch (error) {
            next(error)
        }
    }
)

router.post(
    '/:id/minutes',
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
            sendSuccess(res, minutes)
        } catch (error) {
            next(error)
        }
    }
)

router.get(
    '/rooms',
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const rooms = await meetingService.getMeetingRooms()
            sendSuccess(res, rooms)
        } catch (error) {
            next(error)
        }
    }
)

router.get(
    '/rooms/all',
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const rooms = await meetingService.getAllMeetingRooms()
            sendSuccess(res, rooms)
        } catch (error) {
            next(error)
        }
    }
)

router.post(
    '/rooms',
    [
        body('name').notEmpty().withMessage('会议室名称不能为空'),
        body('capacity').optional().isInt({ min: 1 }),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const room = await meetingService.createMeetingRoom(req.body)
            res.status(201).json(success(room))
        } catch (error) {
            next(error)
        }
    }
)

router.put(
    '/rooms/:id',
    [
        param('id').isString(),
        body('name').optional().isString(),
        body('capacity').optional().isInt({ min: 1 }),
        body('location').optional().isString(),
        body('equipment').optional().isArray(),
        body('description').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const room = await meetingService.updateMeetingRoom(req.params.id, req.body)
            sendSuccess(res, room)
        } catch (error) {
            next(error)
        }
    }
)

router.delete(
    '/rooms/:id',
    [param('id').isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await meetingService.deleteMeetingRoom(req.params.id)
            sendSuccess(res, null, '会议室已停用')
        } catch (error) {
            next(error)
        }
    }
)

router.get(
    '/expense-categories',
    [query('all').optional().isBoolean().toBoolean()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const activeOnly = !req.query.all
            const configs = await meetingService.getExpenseCategoryConfigs(activeOnly)
            sendSuccess(res, configs)
        } catch (error) {
            next(error)
        }
    }
)

router.post(
    '/expense-categories',
    [
        body('code').notEmpty().withMessage('分类编码不能为空'),
        body('name').notEmpty().withMessage('分类名称不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const config = await meetingService.createExpenseCategoryConfig(req.body)
            res.status(201).json(success(config))
        } catch (error) {
            next(error)
        }
    }
)

router.put(
    '/expense-categories/:id',
    [
        param('id').isString(),
        body('name').optional().isString(),
        body('description').optional().isString(),
        body('limit').optional().isNumeric(),
        body('requiresReceipt').optional().isBoolean(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const config = await meetingService.updateExpenseCategoryConfig(req.params.id, req.body)
            sendSuccess(res, config)
        } catch (error) {
            next(error)
        }
    }
)

router.delete(
    '/expense-categories/:id',
    [param('id').isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await meetingService.deleteExpenseCategoryConfig(req.params.id)
            sendSuccess(res, null, '分类已停用')
        } catch (error) {
            next(error)
        }
    }
)

export default router
