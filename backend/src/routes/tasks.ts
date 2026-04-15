import { Router, Request, Response, NextFunction } from 'express'
import { body, param, query } from 'express-validator'
import { taskService } from '../services/index.js'
import { validate, authMiddleware } from '../middlewares/index.js'
import { sendSuccess, success } from '../utils/responseHelper.js'

const router = Router()

/**
 * GET /tasks - 获取任务列表
 */
router.get(
    '/',
    authMiddleware,
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('status').optional().isString(),
        query('priority').optional().isString(),
        query('assignedToId').optional().isString(),
        query('projectId').optional().isString(),
        query('leadId').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters = {
                status: req.query.status as string | undefined,
                priority: req.query.priority as string | undefined,
                assignedToId: req.query.assignedToId as string | undefined,
                projectId: req.query.projectId as string | undefined,
                leadId: req.query.leadId as string | undefined,
            }
            const pagination = {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20,
                sortBy: (req.query.sortBy as string) || 'createdAt',
                sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
            }

            const result = await taskService.getTasks(filters as any, pagination)
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /tasks/board - 获取看板视图数据
 */
router.get('/board', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assignedToId = req.query.assignedToId as string | undefined
        const result = await taskService.getTasksByStatus(assignedToId)
        sendSuccess(res, result)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /tasks/stats - 获取任务统计
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assignedToId = req.query.assignedToId as string | undefined
        const stats = await taskService.getTaskStats(assignedToId)
        sendSuccess(res, stats)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /tasks/:id - 获取任务详情
 */
router.get(
    '/:id',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const task = await taskService.getTaskById(req.params.id)
            sendSuccess(res, task)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /tasks - 创建任务
 */
router.post(
    '/',
    authMiddleware,
    [
        body('title').notEmpty().withMessage('任务标题不能为空'),
        body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
        body('dueDate').optional().isISO8601(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const task = await taskService.createTask(req.body)
            res.status(201).json(success(task))
        } catch (error) {
            next(error)
        }
    }
)

/**
 * PUT /tasks/:id - 更新任务
 */
router.put(
    '/:id',
    authMiddleware,
    [
        param('id').notEmpty(),
        body('status').optional().isIn(['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED']),
        body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const task = await taskService.updateTask(req.params.id, req.body)
            sendSuccess(res, task)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * DELETE /tasks/:id - 删除任务
 */
router.delete(
    '/:id',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await taskService.deleteTask(req.params.id)
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

export default router
