/**
 * Webhook 管理路由
 * 提供 CRUD 接口管理 Webhook 端点
 */
import { Router, Request, Response, NextFunction } from 'express'
import { body, param } from 'express-validator'
import { validate, authMiddleware, adminAuth } from '../middlewares/index.js'
import { webhookService } from '../services/webhookService.js'
import { sendSuccess, success } from '../utils/responseHelper.js'

const router = Router()

// 所有路由需要管理员权限
router.use(adminAuth)

/**
 * GET /webhooks - 获取所有 Webhook 端点
 */
router.get('/', authMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const endpoints = await webhookService.listEndpoints()
        sendSuccess(res, endpoints)
    } catch (error) {
        next(error)
    }
})

/**
 * POST /webhooks - 注册新 Webhook 端点
 */
router.post(
    '/',
    authMiddleware,
    [
        body('url').isURL().withMessage('请提供有效的 URL'),
        body('events').isArray({ min: 1 }).withMessage('至少选择一个事件'),
        body('name').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const endpoint = await webhookService.registerEndpoint({
                url: req.body.url,
                events: req.body.events,
                name: req.body.name,
                createdById: req.user!.id,
            })
            res.status(201).json(success(endpoint))
        } catch (error) {
            next(error)
        }
    }
)

/**
 * PUT /webhooks/:id - 更新端点
 */
router.put(
    '/:id',
    authMiddleware,
    [
        param('id').notEmpty(),
        body('url').optional().isURL(),
        body('events').optional().isArray(),
        body('secret').optional().isString(),
        body('enabled').optional().isBoolean(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const endpoint = await webhookService.updateEndpoint(req.params.id, req.body)
            sendSuccess(res, endpoint)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * DELETE /webhooks/:id - 删除端点
 */
router.delete(
    '/:id',
    authMiddleware,
    [param('id').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await webhookService.deleteEndpoint(req.params.id)
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

export default router
