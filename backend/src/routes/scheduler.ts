import { Router, Request, Response, NextFunction } from 'express'
import { body, param } from 'express-validator'
import { schedulerService } from '../services/schedulerService.js'
import { emailSenderService } from '../services/emailSenderService.js'
import { validate, authMiddleware, adminAuth } from '../middlewares/index.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'

const router = Router()

// 所有路由需要管理员权限
router.use(adminAuth)

// ==================== 定时任务管理 ====================

/**
 * @openapi
 * /scheduler/tasks:
 *   get:
 *     tags: [Scheduler]
 *     summary: 获取所有定时任务状态
 *     description: 仅管理员可用，返回所有定时任务的运行状态和配置
 *     responses:
 *       200:
 *         description: 成功获取任务状态列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: 未授权
 *       403:
 *         description: 非管理员无权访问
 */
/**
 * GET /scheduler/tasks - 获取所有定时任务状态
 */
router.get(
    '/tasks',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tasks = schedulerService.getTasksStatus()
            sendSuccess(res, tasks)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * @openapi
 * /scheduler/tasks/{name}/trigger:
 *   post:
 *     tags: [Scheduler]
 *     summary: 手动触发定时任务
 *     description: 仅管理员可用，手动执行指定的定时任务
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务名称
 *     responses:
 *       200:
 *         description: 任务触发成功
 *       401:
 *         description: 未授权
 *       403:
 *         description: 非管理员无权操作
 *       404:
 *         description: 任务不存在
 */
/**
 * POST /scheduler/tasks/:name/trigger - 手动触发任务
 */
router.post(
    '/tasks/:name/trigger',
    authMiddleware,
    [param('name').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await schedulerService.triggerTask(req.params.name)
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * PUT /scheduler/tasks/:name - 更新任务配置
 */
router.put(
    '/tasks/:name',
    authMiddleware,
    [
        param('name').notEmpty(),
        body('enabled').optional().isBoolean(),
        body('cronExpression').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const updated = await schedulerService.updateTask(req.params.name, {
                enabled: req.body.enabled,
                cronExpression: req.body.cronExpression
            })

            if (updated) {
                sendSuccess(res, null, '任务配置已更新')
            } else {
                sendError(res, '任务不存在', 404)
            }
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /scheduler/run-all - 检查并运行所有到期任务
 */
router.post(
    '/run-all',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const results = await schedulerService.checkAndRunDueTasks()
            sendSuccess(res, { executed: results.length, results })
        } catch (error) {
            next(error)
        }
    }
)

// ==================== 邮件服务管理 ====================

/**
 * GET /scheduler/email/status - 获取邮件服务状态
 */
router.get(
    '/email/status',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const status = emailSenderService.getStatus()
            sendSuccess(res, status)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /scheduler/email/test - 测试邮件连接
 */
router.post(
    '/email/test',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await emailSenderService.testConnection()
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /scheduler/email/test-send - 发送测试邮件
 */
router.post(
    '/email/test-send',
    authMiddleware,
    [body('to').isEmail().withMessage('收件人邮箱格式不正确')],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await emailSenderService.send({
                to: req.body.to,
                subject: '同海 CRM 测试邮件',
                html: `
                    <h1>邮件发送测试成功！</h1>
                    <p>这是来自同海 CRM 系统的测试邮件。</p>
                    <p>发送时间: ${new Date().toLocaleString('zh-CN')}</p>
                `
            })

            sendSuccess(res, { success: result.success, messageId: result.messageId, error: result.error }, result.success ? '测试邮件已发送' : '发送失败')
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /scheduler/email/initialize - 重新初始化邮件配置
 */
router.post(
    '/email/initialize',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await emailSenderService.initialize()
            const status = emailSenderService.getStatus()
            sendSuccess(res, status, '邮件服务已重新初始化')
        } catch (error) {
            next(error)
        }
    }
)

export default router
