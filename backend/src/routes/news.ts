import { Router, Request, Response, NextFunction } from 'express'
import { newsService } from '../services/newsService.js'
import { sendSuccess } from '../utils/responseHelper.js'
import { NotFoundError } from '../middlewares/index.js'

const router = Router()

/**
 * 获取已发布的文章列表
 * GET /api/v1/news
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
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
        next(error)
    }
})

/**
 * 获取热门文章
 * GET /api/v1/news/popular
 */
router.get('/popular', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { limit = '5', locale = 'zh' } = req.query
        const articles = await newsService.getPopularArticles(
            parseInt(limit as string, 10),
            locale as string
        )
        sendSuccess(res, articles)
    } catch (error) {
        next(error)
    }
})

/**
 * 获取文章详情
 * GET /api/v1/news/:id
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { locale = 'zh' } = req.query
        const article = await newsService.getArticleById(req.params.id, locale as string)

        if (!article) {
            return next(new NotFoundError('文章不存在'))
        }

        sendSuccess(res, article)
    } catch (error) {
        next(error)
    }
})

export default router
