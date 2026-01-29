import { Router, Request, Response, NextFunction } from 'express'
import { body, query } from 'express-validator'
import { appointmentService } from '../services/index.js'
import { validate, authMiddleware } from '../middlewares/index.js'

const router = Router()

// 获取预约列表
router.get(
    '/',
    authMiddleware,
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt().toInt(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('userId').optional().isString(),
        query('status').optional().isString()
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = Number(req.query.page) || 1
            const limit = Number(req.query.limit) || 20
            const filters = {
                userId: req.query.userId as string,
                customerId: req.query.customerId as string,
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string,
                status: req.query.status as any
            }

            const result = await appointmentService.getAppointments(filters, { page, limit })
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

// 创建预约
router.post(
    '/',
    authMiddleware,
    [
        body('title').notEmpty().withMessage('标题不能为空'),
        body('startTime').isISO8601(),
        body('endTime').isISO8601(),
        body('userId').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.body.userId) {
                req.body.userId = req.user!.id
            }
            const result = await appointmentService.createAppointment(req.body)
            res.status(201).json(result)
        } catch (error) {
            next(error)
        }
    }
)

// 更新预约
router.put(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await appointmentService.updateAppointment(req.params.id, req.body)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

// 删除预约
router.delete(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await appointmentService.deleteAppointment(req.params.id)
            res.json({ success: true })
        } catch (error) {
            next(error)
        }
    }
)

export default router
