import { Router, Request, Response, NextFunction } from 'express'
import { body, param } from 'express-validator'
import { schedulerService } from '../services/schedulerService.js'
import { emailSenderService } from '../services/emailSenderService.js'
import { validate, authMiddleware } from '../middlewares/index.js'

const router = Router()

// ==================== 定时任务管理 ====================

/**
 * GET /scheduler/tasks - 获取所有定时任务状态
 */
router.get(
    '/tasks',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tasks = schedulerService.getTasksStatus()
            res.json(tasks)
        } catch (error) {
            next(error)
        }
    }
)

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
            res.json(result)
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
    [param('name').notEmpty()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const success = await schedulerService.updateTask(req.params.name, {
                enabled: req.body.enabled,
                cronExpression: req.body.cronExpression
            })

            if (success) {
                res.json({ success: true, message: '任务配置已更新' })
            } else {
                res.status(404).json({ success: false, message: '任务不存在' })
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
            res.json({
                executed: results.length,
                results
            })
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
            res.json(status)
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
            res.json(result)
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

            res.json({
                success: result.success,
                message: result.success ? '测试邮件已发送' : '发送失败',
                messageId: result.messageId,
                error: result.error
            })
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
            res.json({
                success: true,
                message: '邮件服务已重新初始化',
                status
            })
        } catch (error) {
            next(error)
        }
    }
)

export default router
