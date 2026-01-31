import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middlewares/auth.js'
import { newsService } from '../services/newsService.js'
import { rssFetchService } from '../services/rssFetchService.js'
import { prisma } from '../config/index.js'

const router = Router()

// 所有路由需要认证
router.use(authMiddleware)

// ==================== 文章管理 ====================

/**
 * 获取所有文章（管理端）
 * GET /api/v1/news-admin/articles
 */
router.get('/articles', async (req: Request, res: Response) => {
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

        res.json({ success: true, data: result })
    } catch (error) {
        console.error('Error fetching articles:', error)
        res.status(500).json({ success: false, message: '获取文章失败' })
    }
})

/**
 * 获取单篇文章
 * GET /api/v1/news-admin/articles/:id
 */
router.get('/articles/:id', async (req: Request, res: Response) => {
    try {
        const article = await newsService.getArticleByIdAdmin(req.params.id)
        if (!article) {
            return res.status(404).json({ success: false, message: '文章不存在' })
        }
        res.json({ success: true, data: article })
    } catch (error) {
        console.error('Error fetching article:', error)
        res.status(500).json({ success: false, message: '获取文章失败' })
    }
})

/**
 * 创建文章
 * POST /api/v1/news-admin/articles
 */
router.post('/articles', async (req: Request, res: Response) => {
    try {
        const article = await newsService.createArticle({
            ...req.body,
            source: req.body.source || 'manual',
        })
        res.json({ success: true, data: article, message: '文章创建成功' })
    } catch (error) {
        console.error('Error creating article:', error)
        res.status(500).json({ success: false, message: '创建文章失败' })
    }
})

/**
 * 更新文章
 * PUT /api/v1/news-admin/articles/:id
 */
router.put('/articles/:id', async (req: Request, res: Response) => {
    try {
        const article = await newsService.updateArticle(req.params.id, req.body)
        res.json({ success: true, data: article, message: '文章更新成功' })
    } catch (error) {
        console.error('Error updating article:', error)
        res.status(500).json({ success: false, message: '更新文章失败' })
    }
})

/**
 * 发布文章
 * POST /api/v1/news-admin/articles/:id/publish
 */
router.post('/articles/:id/publish', async (req: Request, res: Response) => {
    try {
        const article = await newsService.publishArticle(req.params.id)
        res.json({ success: true, data: article, message: '文章已发布' })
    } catch (error) {
        console.error('Error publishing article:', error)
        res.status(500).json({ success: false, message: '发布失败' })
    }
})

/**
 * 取消发布
 * POST /api/v1/news-admin/articles/:id/unpublish
 */
router.post('/articles/:id/unpublish', async (req: Request, res: Response) => {
    try {
        const article = await newsService.unpublishArticle(req.params.id)
        res.json({ success: true, data: article, message: '已取消发布' })
    } catch (error) {
        console.error('Error unpublishing article:', error)
        res.status(500).json({ success: false, message: '操作失败' })
    }
})

/**
 * 置顶/取消置顶
 * POST /api/v1/news-admin/articles/:id/toggle-top
 */
router.post('/articles/:id/toggle-top', async (req: Request, res: Response) => {
    try {
        const article = await newsService.toggleTop(req.params.id)
        res.json({
            success: true,
            data: article,
            message: article.isTop ? '已置顶' : '已取消置顶',
        })
    } catch (error) {
        console.error('Error toggling top:', error)
        res.status(500).json({ success: false, message: '操作失败' })
    }
})

/**
 * 删除文章
 * DELETE /api/v1/news-admin/articles/:id
 */
router.delete('/articles/:id', async (req: Request, res: Response) => {
    try {
        await newsService.deleteArticle(req.params.id)
        res.json({ success: true, message: '文章已删除' })
    } catch (error) {
        console.error('Error deleting article:', error)
        res.status(500).json({ success: false, message: '删除失败' })
    }
})

/**
 * 批量删除
 * POST /api/v1/news-admin/articles/batch-delete
 */
router.post('/articles/batch-delete', async (req: Request, res: Response) => {
    try {
        const { ids } = req.body
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: '请选择要删除的文章' })
        }
        await newsService.deleteArticles(ids)
        res.json({ success: true, message: `已删除 ${ids.length} 篇文章` })
    } catch (error) {
        console.error('Error batch deleting:', error)
        res.status(500).json({ success: false, message: '批量删除失败' })
    }
})

/**
 * 导入微信公众号文章
 * POST /api/v1/news-admin/articles/import-wechat
 */
router.post('/articles/import-wechat', async (req: Request, res: Response) => {
    try {
        const { url, type = 'COMPANY' } = req.body

        if (!url) {
            return res.status(400).json({ success: false, message: '请输入公众号文章链接' })
        }

        // 验证是微信链接
        if (!url.includes('mp.weixin.qq.com')) {
            return res.status(400).json({ success: false, message: '请输入有效的微信公众号文章链接' })
        }

        // 获取文章内容
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })

        if (!response.ok) {
            return res.status(400).json({ success: false, message: '无法访问文章链接' })
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

        res.json({
            success: true,
            data: article,
            message: '文章导入成功，已保存为草稿'
        })
    } catch (error) {
        console.error('Error importing wechat article:', error)
        res.status(500).json({ success: false, message: '导入失败，请检查链接是否有效' })
    }
})

// ==================== RSS 源管理 ====================

/**
 * 获取所有 RSS 源
 * GET /api/v1/news-admin/feeds
 */
router.get('/feeds', async (req: Request, res: Response) => {
    try {
        const feeds = await rssFetchService.getAllFeeds(true)
        res.json({ success: true, data: feeds })
    } catch (error) {
        console.error('Error fetching feeds:', error)
        res.status(500).json({ success: false, message: '获取订阅源失败' })
    }
})

/**
 * 获取单个 RSS 源
 * GET /api/v1/news-admin/feeds/:id
 */
router.get('/feeds/:id', async (req: Request, res: Response) => {
    try {
        const feed = await rssFetchService.getFeedById(req.params.id)
        if (!feed) {
            return res.status(404).json({ success: false, message: '订阅源不存在' })
        }
        res.json({ success: true, data: feed })
    } catch (error) {
        console.error('Error fetching feed:', error)
        res.status(500).json({ success: false, message: '获取订阅源失败' })
    }
})

/**
 * 测试 RSS 源
 * POST /api/v1/news-admin/feeds/test
 */
router.post('/feeds/test', async (req: Request, res: Response) => {
    try {
        const { url } = req.body
        if (!url) {
            return res.status(400).json({ success: false, message: '请输入 RSS URL' })
        }
        const result = await rssFetchService.testFeed(url)
        res.json({ success: true, data: result })
    } catch (error) {
        console.error('Error testing feed:', error)
        res.status(500).json({ success: false, message: '测试失败' })
    }
})

/**
 * 创建 RSS 源
 * POST /api/v1/news-admin/feeds
 */
router.post('/feeds', async (req: Request, res: Response) => {
    try {
        const feed = await rssFetchService.createFeed(req.body)
        res.json({ success: true, data: feed, message: '订阅源创建成功' })
    } catch (error: any) {
        console.error('Error creating feed:', error)
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: '该 RSS URL 已存在' })
        }
        res.status(500).json({ success: false, message: '创建订阅源失败' })
    }
})

/**
 * 更新 RSS 源
 * PUT /api/v1/news-admin/feeds/:id
 */
router.put('/feeds/:id', async (req: Request, res: Response) => {
    try {
        const feed = await rssFetchService.updateFeed(req.params.id, req.body)
        res.json({ success: true, data: feed, message: '订阅源更新成功' })
    } catch (error) {
        console.error('Error updating feed:', error)
        res.status(500).json({ success: false, message: '更新订阅源失败' })
    }
})

/**
 * 删除 RSS 源
 * DELETE /api/v1/news-admin/feeds/:id
 */
router.delete('/feeds/:id', async (req: Request, res: Response) => {
    try {
        await rssFetchService.deleteFeed(req.params.id)
        res.json({ success: true, message: '订阅源已删除' })
    } catch (error) {
        console.error('Error deleting feed:', error)
        res.status(500).json({ success: false, message: '删除订阅源失败' })
    }
})

/**
 * 手动抓取单个 RSS 源
 * POST /api/v1/news-admin/feeds/:id/fetch
 */
router.post('/feeds/:id/fetch', async (req: Request, res: Response) => {
    try {
        const result = await rssFetchService.fetchFeed(req.params.id)
        if (result.success) {
            res.json({
                success: true,
                message: `抓取成功，新增 ${result.newCount} 篇文章`,
                data: result,
            })
        } else {
            res.status(400).json({ success: false, message: result.error })
        }
    } catch (error) {
        console.error('Error fetching feed:', error)
        res.status(500).json({ success: false, message: '抓取失败' })
    }
})

/**
 * 抓取所有 RSS 源
 * POST /api/v1/news-admin/feeds/fetch-all
 */
router.post('/feeds/fetch-all', async (req: Request, res: Response) => {
    try {
        const result = await rssFetchService.fetchAllFeeds()
        res.json({
            success: true,
            message: `抓取完成：${result.successCount}/${result.totalFeeds} 成功，新增 ${result.newArticles} 篇`,
            data: result,
        })
    } catch (error) {
        console.error('Error fetching all feeds:', error)
        res.status(500).json({ success: false, message: '批量抓取失败' })
    }
})

// ==================== 统计数据 ====================

/**
 * 获取新闻统计
 * GET /api/v1/news-admin/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
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

        res.json({
            success: true,
            data: {
                totalArticles,
                publishedCount,
                draftCount,
                totalFeeds,
                activeFeeds,
                totalViews: totalViews._sum.viewCount || 0,
            },
        })
    } catch (error) {
        console.error('Error fetching stats:', error)
        res.status(500).json({ success: false, message: '获取统计失败' })
    }
})

export default router
