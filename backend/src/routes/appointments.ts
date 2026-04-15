import { Router, Request, Response, NextFunction } from 'express'
import { body, query } from 'express-validator'
import { appointmentService } from '../services/index.js'
import { validate, authMiddleware } from '../middlewares/index.js'
import { sendSuccess, success } from '../utils/responseHelper.js'

const router = Router()

/**
 * @openapi
 * /appointments:
 *   get:
 *     tags: [Appointments]
 *     summary: 获取预约列表
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取预约列表
 *       401:
 *         description: 未授权
 */
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
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * @openapi
 * /appointments:
 *   post:
 *     tags: [Appointments]
 *     summary: 创建预约
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, startTime, endTime]
 *             properties:
 *               title:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: 预约创建成功
 *       401:
 *         description: 未授权
 */
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
            res.status(201).json(success(result))
        } catch (error) {
            next(error)
        }
    }
)

// 更新预约
router.put(
    '/:id',
    authMiddleware,
    [
        body('date').optional().isISO8601(),
        body('time').optional().isString(),
        body('duration').optional().isInt({min:15}),
        body('notes').optional().isString(),
        body('status').optional().isIn(['SCHEDULED','COMPLETED','CANCELLED','NO_SHOW']),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await appointmentService.updateAppointment(req.params.id, req.body)
            sendSuccess(res, result)
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
            sendSuccess(res, null)
        } catch (error) {
            next(error)
        }
    }
)

export default router
