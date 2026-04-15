import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { validate } from '../middlewares/index.js'
import { faqService } from '../services/faqService.js'
import { chatService } from '../services/chatService.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'
import rateLimit from 'express-rate-limit'

const router = Router()

// 聊天 API 速率限制：每分钟最多 20 条消息，防止 AI API 成本滥用
const chatRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { code: 'RATE_LIMITED', message: '消息发送过于频繁，请稍后再试' },
    standardHeaders: true,
    legacyHeaders: false,
})

// ==================== FAQ 公开 API ====================

/**
 * 获取所有启用的 FAQ 分类
 * GET /api/v1/chat/faq/categories
 */
router.get('/faq/categories', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await faqService.getCategories(false)
        sendSuccess(res, categories)
    } catch (error) {
        next(error)
    }
})

/**
 * 获取分类下的 FAQ 列表
 * GET /api/v1/chat/faq/categories/:id/items
 */
router.get('/faq/categories/:id/items', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const category = await faqService.getCategoryById(req.params.id)
        if (!category) {
            return sendError(res, '分类不存在', 404)
        }
        sendSuccess(res, category.items)
    } catch (error) {
        next(error)
    }
})

/**
 * 搜索 FAQ
 * GET /api/v1/chat/faq/search?q=xxx&locale=zh
 */
router.get('/faq/search', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = req.query.q as string
        const locale = (req.query.locale as 'zh' | 'en') || 'zh'

        if (!query || query.trim().length < 2) {
            return sendSuccess(res, [])
        }

        const results = await faqService.searchFaqs(query, locale)
        sendSuccess(res, results)
    } catch (error) {
        next(error)
    }
})

/**
 * 获取 FAQ 详情并增加查看次数
 * GET /api/v1/chat/faq/items/:id
 */
router.get('/faq/items/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const item = await faqService.getItemById(req.params.id)
        if (!item) {
            return sendError(res, 'FAQ 不存在', 404)
        }

        // 增加查看次数
        await faqService.incrementViewCount(req.params.id)

        sendSuccess(res, item)
    } catch (error) {
        next(error)
    }
})

/**
 * 标记 FAQ 为有帮助
 * POST /api/v1/chat/faq/items/:id/helpful
 */
router.post('/faq/items/:id/helpful', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await faqService.incrementHelpfulCount(req.params.id)
        sendSuccess(res, null, '感谢您的反馈')
    } catch (error) {
        next(error)
    }
})

// ==================== Chat API ====================

/**
 * 发送聊天消息
 * POST /api/v1/chat/message
 */
router.post('/message',
    chatRateLimiter,
    [
        body('content').notEmpty().withMessage('消息内容不能为空'),
        body('sessionId').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId, message, visitorId, visitorName, visitorEmail, locale } = req.body

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return sendError(res, '消息不能为空', 400)
        }

        if (message.length > 1000) {
            return sendError(res, '消息过长，请控制在1000字以内', 400)
        }

        const response = await chatService.sendMessage({
            sessionId,
            message: message.trim(),
            visitorId,
            visitorName,
            visitorEmail,
            locale: locale || 'zh'
        })

        sendSuccess(res, response)
    } catch (error) {
        next(error)
    }
})

/**
 * 获取会话历史
 * GET /api/v1/chat/sessions/:id/history
 */
router.get('/sessions/:id/history', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const messages = await chatService.getSessionHistory(req.params.id)
        sendSuccess(res, messages)
    } catch (error) {
        next(error)
    }
})

/**
 * 关闭会话
 * POST /api/v1/chat/sessions/:id/close
 */
router.post('/sessions/:id/close', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await chatService.closeSession(req.params.id)
        sendSuccess(res, null, '会话已关闭')
    } catch (error) {
        next(error)
    }
})

/**
 * 标记消息反馈
 * POST /api/v1/chat/messages/:id/feedback
 */
router.post('/messages/:id/feedback',
    [
        body('isHelpful').isBoolean().withMessage('isHelpful必须为布尔值'),
        body('comment').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { isHelpful } = req.body

        if (typeof isHelpful !== 'boolean') {
            return sendError(res, '无效的反馈值', 400)
        }

        await chatService.markMessageHelpful(req.params.id, isHelpful)
        sendSuccess(res, null, '感谢您的反馈')
    } catch (error) {
        next(error)
    }
})

export default router
