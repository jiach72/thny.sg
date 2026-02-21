import { Router, Request, Response, NextFunction } from 'express'
import { body, param } from 'express-validator'
import { workflowService } from '../services/workflowService.js'
import { validate, authMiddleware } from '../middlewares/index.js'

const router = Router()

// ==================== 团队工作负载 ====================

/**
 * GET /workflow/workload - 获取团队工作负载
 */
router.get(
    '/workload',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const workload = await workflowService.getTeamWorkload()
            res.json(workload)
        } catch (error) {
            next(error)
        }
    }
)

// ==================== 智能分配 ====================

/**
 * POST /workflow/leads/:id/auto-assign - 智能分配单个线索
 */
router.post(
    '/leads/:id/auto-assign',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const lead = await workflowService.autoAssignLead(req.params.id)
            res.json({
                success: true,
                lead,
                message: `线索已分配给 ${lead.assignedTo?.name || '未知用户'}`
            })
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /workflow/leads/batch-assign - 批量智能分配
 */
router.post(
    '/leads/batch-assign',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await workflowService.batchAutoAssign()
            res.json({
                success: true,
                ...result,
                message: `已分配 ${result.assigned} 条线索，失败 ${result.failed} 条`
            })
        } catch (error) {
            next(error)
        }
    }
)

// ==================== 跟进待办 ====================

/**
 * GET /workflow/follow-ups - 获取当前用户的跟进待办
 */
router.get(
    '/follow-ups',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters = {
                type: req.query.type as 'LEAD' | 'TASK' | 'ALL' | undefined,
                priority: req.query.priority as string | undefined,
                overdue: req.query.overdue === 'true'
            }
            const items = await workflowService.getFollowUpList(req.user!.id, filters)
            res.json(items)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /workflow/follow-ups/:userId - 获取指定用户的跟进待办（管理员）
 */
router.get(
    '/follow-ups/:userId',
    authMiddleware,
    [param('userId').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters = {
                type: req.query.type as 'LEAD' | 'TASK' | 'ALL' | undefined,
                priority: req.query.priority as string | undefined,
                overdue: req.query.overdue === 'true'
            }
            const items = await workflowService.getFollowUpList(req.params.userId, filters)
            res.json(items)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /workflow/overdue-stats - 获取逾期统计
 */
router.get(
    '/overdue-stats',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.query.userId as string | undefined
            const stats = await workflowService.getOverdueStats(userId || req.user!.id)
            res.json(stats)
        } catch (error) {
            next(error)
        }
    }
)

// ==================== SOP 模板 ====================

/**
 * GET /workflow/sop/:serviceType - 获取服务类型的 SOP 步骤
 */
router.get(
    '/sop/:serviceType',
    authMiddleware,
    [param('serviceType').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const steps = await workflowService.getSopSteps(req.params.serviceType)
            res.json({ serviceType: req.params.serviceType, steps })
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /workflow/leads/:id/create-sop - 为线索创建 SOP 任务序列
 */
router.post(
    '/leads/:id/create-sop',
    authMiddleware,
    [
        param('id').notEmpty(),
        body('serviceType').notEmpty().withMessage('服务类型不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const assigneeId = req.body.assigneeId || req.user!.id
            const tasks = await workflowService.createSopTasks(
                req.params.id,
                assigneeId,
                req.body.serviceType
            )
            res.status(201).json({
                success: true,
                tasksCreated: tasks.length,
                tasks
            })
        } catch (error) {
            next(error)
        }
    }
)

// ==================== 工作流设计与存取 ====================

/**
 * POST /workflow/definitions - 保存新的工作流配置
 */
router.post(
    '/definitions',
    authMiddleware,
    [
        body('name').notEmpty().withMessage('名称不能为空'),
        body('triggerType').notEmpty().withMessage('触发条件不能为空')
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await workflowService.saveWorkflowDefinition(req.body, req.user!.id)
            res.status(201).json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /workflow/definitions/test - 测试工作流配置
 */
router.post(
    '/definitions/test',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await workflowService.testWorkflowDefinition(req.body)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

export default router
