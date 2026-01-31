import { Router, Request, Response, NextFunction } from 'express'
import { body, param } from 'express-validator'
import { scoringService } from '../services/index.js'
import { validate, authMiddleware } from '../middlewares/index.js'

const router = Router()

// ==================== 评分规则管理 ====================

/**
 * GET /scoring/rules - 获取所有评分规则
 */
router.get(
    '/rules',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const includeInactive = req.query.includeInactive === 'true'
            const rules = await scoringService.getRules(includeInactive)
            res.json(rules)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /scoring/rules/:id - 获取规则详情
 */
router.get(
    '/rules/:id',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rule = await scoringService.getRuleById(req.params.id)
            if (!rule) {
                return res.status(404).json({ message: '规则不存在' })
            }
            res.json(rule)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /scoring/rules - 创建评分规则
 */
router.post(
    '/rules',
    authMiddleware,
    [
        body('name').notEmpty().withMessage('规则名称不能为空'),
        body('field').notEmpty().withMessage('字段名不能为空'),
        body('operator').notEmpty().withMessage('操作符不能为空'),
        body('score').isInt().withMessage('分值必须是整数'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rule = await scoringService.createRule(req.body)
            res.status(201).json(rule)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * PUT /scoring/rules/:id - 更新评分规则
 */
router.put(
    '/rules/:id',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rule = await scoringService.updateRule(req.params.id, req.body)
            res.json(rule)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * DELETE /scoring/rules/:id - 删除评分规则
 */
router.delete(
    '/rules/:id',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await scoringService.deleteRule(req.params.id)
            res.json({ success: true, message: '规则已删除' })
        } catch (error) {
            next(error)
        }
    }
)

// ==================== 评分操作 ====================

/**
 * POST /scoring/leads/:id/calculate - 计算单个线索评分
 */
router.post(
    '/leads/:id/calculate',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const lead = await scoringService.updateLeadScore(req.params.id) as any
            res.json({
                leadId: lead.id,
                score: lead.score,
                breakdown: lead.scoreBreakdown,
                updatedAt: lead.scoreUpdatedAt
            })
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /scoring/batch - 批量更新所有线索评分
 */
router.post(
    '/batch',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await scoringService.batchUpdateScores()
            res.json({
                success: true,
                ...result,
                message: `已更新 ${result.updated} 条线索评分，失败 ${result.failed} 条`
            })
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /scoring/seed - 初始化默认评分规则
 */
router.post(
    '/seed',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await scoringService.seedDefaultRules()
            res.json({ success: true, message: '默认评分规则已初始化' })
        } catch (error) {
            next(error)
        }
    }
)

export default router
