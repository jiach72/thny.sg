/**
 * RSS 抓取服务
 */
import { prisma } from '../config/index.js'
import { newsService } from './newsService.js'

// RSS 解析器（使用动态导入避免 ESM 问题）
let Parser: any = null

async function getParser() {
    if (!Parser) {
        const rssParser = await import('rss-parser')
        Parser = rssParser.default
    }
    return new Parser({
        timeout: 30000,
        headers: {
            'User-Agent': 'TongHai CRM RSS Fetcher/1.0',
        },
    })
}

export interface RssFeedInput {
    name: string
    url: string
    category: string
    language?: string
    isActive?: boolean
    fetchInterval?: number
}

export const rssFetchService = {
    /**
     * 获取所有 RSS 源
     */
    async getAllFeeds(includeInactive: boolean = false) {
        const where = includeInactive ? {} : { isActive: true }
        return prisma.rssFeed.findMany({
            where,
            include: {
                _count: {
                    select: { articles: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })
    },

    /**
     * 获取单个 RSS 源
     */
    async getFeedById(id: string) {
        return prisma.rssFeed.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { articles: true },
                },
            },
        })
    },

    /**
     * 创建 RSS 源
     */
    async createFeed(data: RssFeedInput) {
        return prisma.rssFeed.create({
            data: {
                name: data.name,
                url: data.url,
                category: data.category,
                language: data.language || 'zh',
                isActive: data.isActive ?? true,
                fetchInterval: data.fetchInterval || 60,
            },
        })
    },

    /**
     * 更新 RSS 源
     */
    async updateFeed(id: string, data: Partial<RssFeedInput>) {
        return prisma.rssFeed.update({
            where: { id },
            data,
        })
    },

    /**
     * 删除 RSS 源
     */
    async deleteFeed(id: string) {
        return prisma.rssFeed.delete({
            where: { id },
        })
    },

    /**
     * 抓取单个 RSS 源
     */
    async fetchFeed(feedId: string): Promise<{
        success: boolean
        newCount: number
        error?: string
    }> {
        const feed = await prisma.rssFeed.findUnique({
            where: { id: feedId },
        })

        if (!feed) {
            return { success: false, newCount: 0, error: '订阅源不存在' }
        }

        try {
            const parser = await getParser()
            const result = await parser.parseURL(feed.url)

            let newCount = 0

            for (const item of result.items || []) {
                // 生成 sourceId（用 GUID 或链接）
                const sourceId = item.guid || item.link || item.title

                if (!sourceId) continue

                // 检查是否已存在
                const exists = await newsService.articleExists('rss', sourceId)
                if (exists) continue

                // 创建文章
                try {
                    await newsService.createArticle({
                        title: item.title || '无标题',
                        content: item.content || item.contentSnippet || item.summary || item.description || '',
                        summary: item.contentSnippet || item.summary || item.description?.substring(0, 300),
                        coverImage: extractImageFromContent(item.content || item['content:encoded']),
                        source: 'rss',
                        sourceUrl: item.link,
                        sourceId,
                        author: item.creator || item.author,
                        type: 'INDUSTRY',
                        category: feed.category,
                        status: 'DRAFT', // RSS 抓取的默认为草稿
                        rssFeedId: feed.id,
                        publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
                    })
                    newCount++
                } catch (err) {
                    console.error(`Failed to create article from RSS item:`, err)
                }
            }

            // 更新抓取时间
            await prisma.rssFeed.update({
                where: { id: feedId },
                data: {
                    lastFetchAt: new Date(),
                    lastError: null,
                },
            })

            return { success: true, newCount }
        } catch (error: any) {
            console.error(`Error fetching RSS feed ${feed.name}:`, error)

            // 记录错误
            await prisma.rssFeed.update({
                where: { id: feedId },
                data: {
                    lastError: error.message || '抓取失败',
                },
            })

            return { success: false, newCount: 0, error: error.message }
        }
    },

    /**
     * 抓取所有活跃的 RSS 源
     */
    async fetchAllFeeds(): Promise<{
        totalFeeds: number
        successCount: number
        newArticles: number
        errors: Array<{ feedId: string; feedName: string; error: string }>
    }> {
        const feeds = await prisma.rssFeed.findMany({
            where: { isActive: true },
        })

        let successCount = 0
        let newArticles = 0
        const errors: Array<{ feedId: string; feedName: string; error: string }> = []

        for (const feed of feeds) {
            const result = await this.fetchFeed(feed.id)
            if (result.success) {
                successCount++
                newArticles += result.newCount
            } else {
                errors.push({
                    feedId: feed.id,
                    feedName: feed.name,
                    error: result.error || '未知错误',
                })
            }
        }

        return {
            totalFeeds: feeds.length,
            successCount,
            newArticles,
            errors,
        }
    },

    /**
     * 测试 RSS 源是否有效
     */
    async testFeed(url: string): Promise<{
        valid: boolean
        title?: string
        itemCount?: number
        error?: string
    }> {
        try {
            const parser = await getParser()
            const result = await parser.parseURL(url)

            return {
                valid: true,
                title: result.title,
                itemCount: result.items?.length || 0,
            }
        } catch (error: any) {
            return {
                valid: false,
                error: error.message || '无法解析 RSS 源',
            }
        }
    },
}

/**
 * 从 HTML 内容中提取第一张图片
 */
function extractImageFromContent(content: string | undefined): string | undefined {
    if (!content) return undefined

    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (imgMatch && imgMatch[1]) {
        return imgMatch[1]
    }

    // 尝试匹配 enclosure 标签中的图片
    const enclosureMatch = content.match(/url=["']([^"']+\.(jpg|jpeg|png|gif|webp))["']/i)
    if (enclosureMatch && enclosureMatch[1]) {
        return enclosureMatch[1]
    }

    return undefined
}
