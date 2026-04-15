import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { adminAuth } from '../middlewares/auth.js'
import { validate, ConflictError } from '../middlewares/index.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'
import { newsService } from '../services/newsService.js'
import { rssFetchService } from '../services/rssFetchService.js'
import { prisma } from '../config/index.js'
import { validateSafeUrl } from '../config/ssrfProtection.js'

const router = Router()

// 所有路由需要管理员权限
router.use(adminAuth)

// ==================== 文章管理 ====================

/**
 * 获取所有文章（管理端）
 * GET /api/v1/news-admin/articles
 */
router.get('/articles', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type, category, status, source, search, page = '1', pageSize = '20' } = req.query

        const result = await newsService.getAllArticles({
            filters: {
                type: type as string,
                category: category as string,
                status: status as string,
                source: source as string,
                search: search as string,
            },
            page: parseInt(page as string, 10),
            pageSize: parseInt(pageSize as string, 10),
        })

        sendSuccess(res, result)
    } catch (error) {
        next(error)
    }
})

/**
 * 获取单篇文章
 * GET /api/v1/news-admin/articles/:id
 */
router.get('/articles/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const article = await newsService.getArticleByIdAdmin(req.params.id)
        if (!article) {
            return sendError(res, '文章不存在', 404)
        }
        sendSuccess(res, article)
    } catch (error) {
        next(error)
    }
})

/**
 * 创建文章
 * POST /api/v1/news-admin/articles
 */
router.post('/articles',
    [
        body('title').notEmpty().withMessage('标题不能为空'),
        body('content').notEmpty().withMessage('内容不能为空'),
        body('category').optional().isString(),
        body('tags').optional().isArray(),
        body('coverImage').optional().isString(),
        body('summary').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const article = await newsService.createArticle({
            ...req.body,
            source: req.body.source || 'manual',
        })
        sendSuccess(res, article, '文章创建成功')
    } catch (error) {
        next(error)
    }
})

/**
 * 更新文章
 * PUT /api/v1/news-admin/articles/:id
 */
router.put('/articles/:id',
    [
        body('title').optional().isString(),
        body('content').optional().isString(),
        body('category').optional().isString(),
        body('tags').optional().isArray(),
        body('coverImage').optional().isString(),
        body('summary').optional().isString(),
        body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const article = await newsService.updateArticle(req.params.id, req.body)
        sendSuccess(res, article, '文章更新成功')
    } catch (error) {
        next(error)
    }
})

/**
 * 发布文章
 * POST /api/v1/news-admin/articles/:id/publish
 */
router.post('/articles/:id/publish', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const article = await newsService.publishArticle(req.params.id)
        sendSuccess(res, article, '文章已发布')
    } catch (error) {
        next(error)
    }
})

/**
 * 取消发布
 * POST /api/v1/news-admin/articles/:id/unpublish
 */
router.post('/articles/:id/unpublish', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const article = await newsService.unpublishArticle(req.params.id)
        sendSuccess(res, article, '已取消发布')
    } catch (error) {
        next(error)
    }
})

/**
 * 置顶/取消置顶
 * POST /api/v1/news-admin/articles/:id/toggle-top
 */
router.post('/articles/:id/toggle-top', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const article = await newsService.toggleTop(req.params.id)
        sendSuccess(res, article, article.isTop ? '已置顶' : '已取消置顶')
    } catch (error) {
        next(error)
    }
})

/**
 * 删除文章
 * DELETE /api/v1/news-admin/articles/:id
 */
router.delete('/articles/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await newsService.deleteArticle(req.params.id)
        sendSuccess(res, null, '文章已删除')
    } catch (error) {
        next(error)
    }
})

/**
 * 批量删除
 * POST /api/v1/news-admin/articles/batch-delete
 */
router.post('/articles/batch-delete',
    [
        body('ids').isArray().withMessage('ids必须为数组'),
        body('ids.*').isString().withMessage('每个id必须为字符串'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ids } = req.body
        if (!Array.isArray(ids) || ids.length === 0) {
            return sendError(res, '请选择要删除的文章', 400)
        }
        await newsService.deleteArticles(ids)
        sendSuccess(res, null, `已删除 ${ids.length} 篇文章`)
    } catch (error) {
        next(error)
    }
})

/**
 * 导入微信公众号文章
 * POST /api/v1/news-admin/articles/import-wechat
 */
router.post('/articles/import-wechat',
    [
        body('url').isURL().withMessage('请提供有效的URL'),
        body('type').optional().isIn(['article', 'feed']),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { url, type = 'COMPANY' } = req.body

        if (!url) {
            return sendError(res, '请输入公众号文章链接', 400)
        }

        // 验证是微信链接
        if (!url.includes('mp.weixin.qq.com')) {
            return sendError(res, '请输入有效的微信公众号文章链接', 400)
        }

        await validateSafeUrl(url)

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })

        if (!response.ok) {
            return sendError(res, '无法访问文章链接', 400)
        }

        const html = await response.text()

        // 提取文章标题
        const titleMatch = html.match(/<h1[^>]*class="rich_media_title"[^>]*>([\s\S]*?)<\/h1>/i)
            || html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
            || html.match(/<title>([^<]+)<\/title>/i)
        const title = titleMatch
            ? titleMatch[1].replace(/<[^>]+>/g, '').trim()
            : '未知标题'

        // 提取作者
        const authorMatch = html.match(/<span[^>]*class="rich_media_meta rich_media_meta_text"[^>]*>([^<]+)<\/span>/i)
            || html.match(/<meta\s+name="author"\s+content="([^"]+)"/i)
            || html.match(/var\s+nickname\s*=\s*"([^"]+)"/i)
        const author = authorMatch ? authorMatch[1].trim() : ''

        // 提取正文内容
        const contentMatch = html.match(/<div[^>]*class="rich_media_content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<script/i)
            || html.match(/<div[^>]*id="js_content"[^>]*>([\s\S]*?)<\/div>\s*<script/i)
        let content = contentMatch ? contentMatch[1] : ''

        // 清理内容 - 移除脚本和样式
        content = content
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '')
            .trim()

        // 提取封面图
        const coverMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
            || html.match(/var\s+msg_cdn_url\s*=\s*"([^"]+)"/i)
        const coverImage = coverMatch ? coverMatch[1] : ''

        // 提取摘要
        const summaryMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)
            || html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
        const summary = summaryMatch ? summaryMatch[1] : ''

        // 创建文章
        const article = await newsService.createArticle({
            title,
            summary,
            content,
            contentEn: '',
            titleEn: '',
            summaryEn: '',
            coverImage,
            author,
            sourceUrl: url,
            source: 'wechat',
            type,
            status: 'DRAFT', // 默认为草稿，让用户审核后发布
            tags: ['公众号'],
        })

        sendSuccess(res, article, '文章导入成功，已保存为草稿')
    } catch (error) {
        next(error)
    }
})

// ==================== RSS 源管理 ====================

/**
 * 获取所有 RSS 源
 * GET /api/v1/news-admin/feeds
 */
router.get('/feeds', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const feeds = await rssFetchService.getAllFeeds(true)
        sendSuccess(res, feeds)
    } catch (error) {
        next(error)
    }
})

/**
 * 获取单个 RSS 源
 * GET /api/v1/news-admin/feeds/:id
 */
router.get('/feeds/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const feed = await rssFetchService.getFeedById(req.params.id)
        if (!feed) {
            return sendError(res, '订阅源不存在', 404)
        }
        sendSuccess(res, feed)
    } catch (error) {
        next(error)
    }
})

/**
 * 测试 RSS 源
 * POST /api/v1/news-admin/feeds/test
 */
router.post('/feeds/test',
    [
        body('url').isURL().withMessage('请提供有效的RSS源URL'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { url } = req.body
        if (!url) {
            return sendError(res, '请输入 RSS URL', 400)
        }
        const result = await rssFetchService.testFeed(url)
        sendSuccess(res, result)
    } catch (error) {
        next(error)
    }
})

/**
 * 创建 RSS 源
 * POST /api/v1/news-admin/feeds
 */
router.post('/feeds',
    [
        body('name').notEmpty().withMessage('名称不能为空'),
        body('url').isURL().withMessage('请提供有效的URL'),
        body('category').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const feed = await rssFetchService.createFeed(req.body)
        sendSuccess(res, feed, '订阅源创建成功')
    } catch (error: any) {
        // P2002: 唯一约束冲突，转换为 ConflictError 交给错误中间件处理
        if (error.code === 'P2002') {
            return next(new ConflictError('该 RSS URL 已存在'))
        }
        next(error)
    }
})

/**
 * 更新 RSS 源
 * PUT /api/v1/news-admin/feeds/:id
 */
router.put('/feeds/:id',
    [
        body('name').optional().isString(),
        body('url').optional().isURL(),
        body('category').optional().isString(),
        body('enabled').optional().isBoolean(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        const feed = await rssFetchService.updateFeed(req.params.id, req.body)
        sendSuccess(res, feed, '订阅源更新成功')
    } catch (error) {
        next(error)
    }
})

/**
 * 删除 RSS 源
 * DELETE /api/v1/news-admin/feeds/:id
 */
router.delete('/feeds/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await rssFetchService.deleteFeed(req.params.id)
        sendSuccess(res, null, '订阅源已删除')
    } catch (error) {
        next(error)
    }
})

/**
 * 手动抓取单个 RSS 源
 * POST /api/v1/news-admin/feeds/:id/fetch
 */
router.post('/feeds/:id/fetch', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await rssFetchService.fetchFeed(req.params.id)
        if (result.success) {
            sendSuccess(res, result, `抓取成功，新增 ${result.newCount} 篇文章`)
        } else {
            sendError(res, result.error || '抓取失败', 400)
        }
    } catch (error) {
        next(error)
    }
})

/**
 * 抓取所有 RSS 源
 * POST /api/v1/news-admin/feeds/fetch-all
 */
router.post('/feeds/fetch-all', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await rssFetchService.fetchAllFeeds()
        sendSuccess(res, result, `抓取完成：${result.successCount}/${result.totalFeeds} 成功，新增 ${result.newArticles} 篇`)
    } catch (error) {
        next(error)
    }
})

// ==================== 统计数据 ====================

/**
 * 获取新闻统计
 * GET /api/v1/news-admin/stats
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [
            totalArticles,
            publishedCount,
            draftCount,
            totalFeeds,
            activeFeeds,
            totalViews,
        ] = await Promise.all([
            prisma.newsArticle.count(),
            prisma.newsArticle.count({ where: { status: 'PUBLISHED' } }),
            prisma.newsArticle.count({ where: { status: 'DRAFT' } }),
            prisma.rssFeed.count(),
            prisma.rssFeed.count({ where: { isActive: true } }),
            prisma.newsArticle.aggregate({ _sum: { viewCount: true } }),
        ])

        sendSuccess(res, {
                totalArticles,
                publishedCount,
                draftCount,
                totalFeeds,
                activeFeeds,
                totalViews: totalViews._sum.viewCount || 0,
            })
    } catch (error) {
        next(error)
    }
})

export default router
