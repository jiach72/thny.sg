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
            const response = await fetch(feed.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const xmlText = await response.text();
            // 修复由于 meta, link 标签未闭合导致 rss-parser 严格模式报错的问题
            const cleanXml = xmlText.replace(/<meta([^>]+)(?!\/|\\\\\/)>/gi, '<meta$1 />').replace(/<link([^>]+)(?!\/|\\\\\/)>/gi, '<link$1 />');

            const parser = await getParser()
            parser.options.xml2js = { ...parser.options.xml2js, strict: false };
            const result = await parser.parseString(cleanXml)

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
                        status: 'PUBLISHED', // 直接设为发布状态，以便在前端展示
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
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const xmlText = await response.text();
            const cleanXml = xmlText.replace(/<meta([^>]+)(?!\/|\\\\\/)>/gi, '<meta$1 />').replace(/<link([^>]+)(?!\/|\\\\\/)>/gi, '<link$1 />');

            const parser = await getParser()
            parser.options.xml2js = { ...parser.options.xml2js, strict: false };
            const result = await parser.parseString(cleanXml)

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
