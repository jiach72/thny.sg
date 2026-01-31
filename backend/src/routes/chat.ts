import { Router, Request, Response } from 'express'
import { faqService } from '../services/faqService.js'
import { chatService } from '../services/chatService.js'

const router = Router()

// ==================== FAQ 公开 API ====================

/**
 * 获取所有启用的 FAQ 分类
 * GET /api/v1/chat/faq/categories
 */
router.get('/faq/categories', async (req: Request, res: Response) => {
    try {
        const categories = await faqService.getCategories(false)
        res.json({ success: true, data: categories })
    } catch (error) {
        console.error('Error fetching FAQ categories:', error)
        res.status(500).json({ success: false, message: '获取 FAQ 分类失败' })
    }
})

/**
 * 获取分类下的 FAQ 列表
 * GET /api/v1/chat/faq/categories/:id/items
 */
router.get('/faq/categories/:id/items', async (req: Request, res: Response) => {
    try {
        const category = await faqService.getCategoryById(req.params.id)
        if (!category) {
            return res.status(404).json({ success: false, message: '分类不存在' })
        }
        res.json({ success: true, data: category.items })
    } catch (error) {
        console.error('Error fetching FAQ items:', error)
        res.status(500).json({ success: false, message: '获取 FAQ 条目失败' })
    }
})

/**
 * 搜索 FAQ
 * GET /api/v1/chat/faq/search?q=xxx&locale=zh
 */
router.get('/faq/search', async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string
        const locale = (req.query.locale as 'zh' | 'en') || 'zh'

        if (!query || query.trim().length < 2) {
            return res.json({ success: true, data: [] })
        }

        const results = await faqService.searchFaqs(query, locale)
        res.json({ success: true, data: results })
    } catch (error) {
        console.error('Error searching FAQs:', error)
        res.status(500).json({ success: false, message: '搜索失败' })
    }
})

/**
 * 获取 FAQ 详情并增加查看次数
 * GET /api/v1/chat/faq/items/:id
 */
router.get('/faq/items/:id', async (req: Request, res: Response) => {
    try {
        const item = await faqService.getItemById(req.params.id)
        if (!item) {
            return res.status(404).json({ success: false, message: 'FAQ 不存在' })
        }

        // 增加查看次数
        await faqService.incrementViewCount(req.params.id)

        res.json({ success: true, data: item })
    } catch (error) {
        console.error('Error fetching FAQ item:', error)
        res.status(500).json({ success: false, message: '获取 FAQ 失败' })
    }
})

/**
 * 标记 FAQ 为有帮助
 * POST /api/v1/chat/faq/items/:id/helpful
 */
router.post('/faq/items/:id/helpful', async (req: Request, res: Response) => {
    try {
        await faqService.incrementHelpfulCount(req.params.id)
        res.json({ success: true, message: '感谢您的反馈' })
    } catch (error) {
        console.error('Error marking FAQ as helpful:', error)
        res.status(500).json({ success: false, message: '操作失败' })
    }
})

// ==================== Chat API ====================

/**
 * 发送聊天消息
 * POST /api/v1/chat/message
 */
router.post('/message', async (req: Request, res: Response) => {
    try {
        const { sessionId, message, visitorId, visitorName, visitorEmail, locale } = req.body

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ success: false, message: '消息不能为空' })
        }

        if (message.length > 1000) {
            return res.status(400).json({ success: false, message: '消息过长，请控制在1000字以内' })
        }

        const response = await chatService.sendMessage({
            sessionId,
            message: message.trim(),
            visitorId,
            visitorName,
            visitorEmail,
            locale: locale || 'zh'
        })

        res.json({ success: true, data: response })
    } catch (error) {
        console.error('Error sending chat message:', error)
        res.status(500).json({ success: false, message: '发送消息失败' })
    }
})

/**
 * 获取会话历史
 * GET /api/v1/chat/sessions/:id/history
 */
router.get('/sessions/:id/history', async (req: Request, res: Response) => {
    try {
        const messages = await chatService.getSessionHistory(req.params.id)
        res.json({ success: true, data: messages })
    } catch (error) {
        console.error('Error fetching session history:', error)
        res.status(500).json({ success: false, message: '获取对话历史失败' })
    }
})

/**
 * 关闭会话
 * POST /api/v1/chat/sessions/:id/close
 */
router.post('/sessions/:id/close', async (req: Request, res: Response) => {
    try {
        await chatService.closeSession(req.params.id)
        res.json({ success: true, message: '会话已关闭' })
    } catch (error) {
        console.error('Error closing session:', error)
        res.status(500).json({ success: false, message: '关闭会话失败' })
    }
})

/**
 * 标记消息反馈
 * POST /api/v1/chat/messages/:id/feedback
 */
router.post('/messages/:id/feedback', async (req: Request, res: Response) => {
    try {
        const { isHelpful } = req.body

        if (typeof isHelpful !== 'boolean') {
            return res.status(400).json({ success: false, message: '无效的反馈值' })
        }

        await chatService.markMessageHelpful(req.params.id, isHelpful)
        res.json({ success: true, message: '感谢您的反馈' })
    } catch (error) {
        console.error('Error marking message feedback:', error)
        res.status(500).json({ success: false, message: '提交反馈失败' })
    }
})

export default router
