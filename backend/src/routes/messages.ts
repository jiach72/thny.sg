import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { authMiddleware, adminAuth, validate } from '../middlewares/index.js'
import messageService from '../services/messageService.js'

const router = Router()

/**
 * GET /messages/unread-count - 获取未读消息数量
 */
router.get(
    '/unread-count',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await messageService.getUnreadCount(req.user!.id)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /messages/mine - 获取我的消息列表
 */
router.get(
    '/mine',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1
            const limit = parseInt(req.query.limit as string) || 20
            const result = await messageService.getMessages(req.user!.id, {}, page, limit)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * PUT /messages/:id/read - 标记消息为已读
 */
router.put(
    '/:id/read',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await messageService.markAsRead(req.params.id, req.user!.id)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * PUT /messages/read-all - 批量标记所有消息为已读
 */
router.put(
    '/read-all',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await messageService.markAllAsRead(req.user!.id)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * DELETE /messages/:id - 删除我的消息
 */
router.delete(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await messageService.delete(req.params.id, req.user!.id)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /messages/send - 发送站内消息（管理端使用）
 */
router.post(
    '/send',
    authMiddleware,
    adminAuth,
    [
        body('recipientId').notEmpty().withMessage('请选择接收者'),
        body('title').notEmpty().withMessage('请输入消息标题'),
        body('content').notEmpty().withMessage('请输入消息内容'),
        body('type').optional().isIn(['SYSTEM', 'PROJECT', 'DOCUMENT', 'PAYMENT', 'REMINDER', 'ANNOUNCEMENT']),
        body('projectId').optional(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const message = await messageService.send({
                senderId: req.user!.id,
                ...req.body,
            })
            res.status(201).json(message)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /messages/send-bulk - 批量发送消息（管理端使用）
 */
router.post(
    '/send-bulk',
    authMiddleware,
    adminAuth,
    [
        body('recipientIds').isArray({ min: 1 }).withMessage('请选择至少一个接收者'),
        body('title').notEmpty().withMessage('请输入消息标题'),
        body('content').notEmpty().withMessage('请输入消息内容'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await messageService.sendBulk(
                req.user!.id,
                req.body.recipientIds,
                req.body.title,
                req.body.content,
                req.body.type || 'ANNOUNCEMENT'
            )
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /messages/sent - 获取已发送的消息（管理端）
 */
router.get(
    '/sent',
    authMiddleware,
    adminAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1
            const limit = parseInt(req.query.limit as string) || 20
            const result = await messageService.getSentMessages(req.user!.id, page, limit)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /messages/customers - 获取可发送消息的客户列表（管理端）
 */
router.get(
    '/customers',
    authMiddleware,
    adminAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const customers = await messageService.getCustomerUsers()
            res.json(customers)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /messages/contact - 客户联系顾问
 */
router.post(
    '/contact',
    authMiddleware,
    [
        body('projectId').notEmpty().withMessage('项目ID不能为空'),
        body('title').notEmpty().withMessage('请输入标题'),
        body('content').notEmpty().withMessage('请输入内容'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { projectId, title, content, recipientId } = req.body

            const message = await messageService.send({
                senderId: req.user!.id,
                recipientId: recipientId,
                title,
                content,
                type: 'PROJECT',
                projectId
            })
            res.status(201).json(message)
        } catch (error) {
            next(error)
        }
    }
)

export default router
