import { Router, Request, Response } from 'express'
import { newsService } from '../services/newsService.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'

const router = Router()

/**
 * 获取已发布的文章列表
 * GET /api/v1/news
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { type, category, page = '1', pageSize = '10', locale = 'zh' } = req.query

        const result = await newsService.getPublishedArticles({
            type: type as string,
            category: category as string,
            page: parseInt(page as string, 10),
            pageSize: parseInt(pageSize as string, 10),
            locale: locale as string,
        })

        sendSuccess(res, result)
    } catch (error) {
        console.error('Error fetching articles:', error)
        sendError(res, '获取文章失败', 500)
    }
})

/**
 * 获取热门文章
 * GET /api/v1/news/popular
 */
router.get('/popular', async (req: Request, res: Response) => {
    try {
        const { limit = '5', locale = 'zh' } = req.query
        const articles = await newsService.getPopularArticles(
            parseInt(limit as string, 10),
            locale as string
        )
        sendSuccess(res, articles)
    } catch (error) {
        console.error('Error fetching popular articles:', error)
        sendError(res, '获取热门文章失败', 500)
    }
})

/**
 * 获取文章详情
 * GET /api/v1/news/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { locale = 'zh' } = req.query
        const article = await newsService.getArticleById(req.params.id, locale as string)

        if (!article) {
            return sendError(res, '文章不存在', 404, 'NOT_FOUND')
        }

        sendSuccess(res, article)
    } catch (error) {
        console.error('Error fetching article:', error)
        sendError(res, '获取文章失败', 500)
    }
})

export default router
