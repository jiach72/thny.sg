/**
 * 新闻服务 - 文章管理
 */
import { NotFoundError } from '../middlewares/errorHandler.js'
import { prisma } from '../config/index.js'
import { Prisma } from '@prisma/client'

export interface CreateArticleInput {
    title: string
    titleEn?: string
    content: string
    contentEn?: string
    summary?: string
    summaryEn?: string
    coverImage?: string
    source: string
    sourceUrl?: string
    sourceId?: string
    author?: string
    type?: string
    category?: string
    tags?: string[]
    status?: string
    isTop?: boolean
    rssFeedId?: string
    publishedAt?: Date
}

export interface UpdateArticleInput extends Partial<CreateArticleInput> { }

export interface ArticleFilters {
    type?: string
    category?: string
    status?: string
    source?: string
    search?: string
}

export const newsService = {
    /**
     * 获取已发布的文章列表（公开接口）
     */
    async getPublishedArticles(options: {
        type?: string
        category?: string
        page?: number
        pageSize?: number
        locale?: string
    }) {
        const { type, category, page = 1, pageSize = 10, locale = 'zh' } = options

        const where: any = {
            status: 'PUBLISHED',
        }

        if (type) {
            where.type = type
        }

        if (category) {
            where.category = category
        }

        const [articles, total] = await Promise.all([
            prisma.newsArticle.findMany({
                where,
                orderBy: [{ isTop: 'desc' }, { publishedAt: 'desc' }],
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    title: true,
                    titleEn: true,
                    summary: true,
                    summaryEn: true,
                    coverImage: true,
                    type: true,
                    category: true,
                    tags: true,
                    author: true,
                    isTop: true,
                    viewCount: true,
                    publishedAt: true,
                },
            }),
            prisma.newsArticle.count({ where }),
        ])

        // 根据语言选择字段
        const localizedArticles = articles.map((article) => ({
            id: article.id,
            title: locale === 'en' && article.titleEn ? article.titleEn : article.title,
            summary: locale === 'en' && article.summaryEn ? article.summaryEn : article.summary,
            coverImage: article.coverImage,
            type: article.type,
            category: article.category,
            tags: article.tags,
            author: article.author,
            isTop: article.isTop,
            viewCount: article.viewCount,
            publishedAt: article.publishedAt,
        }))

        return {
            articles: localizedArticles,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        }
    },

    /**
     * 获取文章详情（公开接口）
     */
    async getArticleById(id: string, locale: string = 'zh') {
        const article = await prisma.newsArticle.findUnique({
            where: { id },
        })

        if (!article || article.status !== 'PUBLISHED') {
            return null
        }

        // 增加浏览量
        await prisma.newsArticle.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        })

        // 根据语言返回内容
        return {
            id: article.id,
            title: locale === 'en' && article.titleEn ? article.titleEn : article.title,
            content: locale === 'en' && article.contentEn ? article.contentEn : article.content,
            summary: locale === 'en' && article.summaryEn ? article.summaryEn : article.summary,
            coverImage: article.coverImage,
            type: article.type,
            category: article.category,
            tags: article.tags,
            author: article.author,
            sourceUrl: article.sourceUrl,
            viewCount: article.viewCount + 1,
            publishedAt: article.publishedAt,
            createdAt: article.createdAt,
        }
    },

    /**
     * 获取热门文章
     */
    async getPopularArticles(limit: number = 5, locale: string = 'zh') {
        const articles = await prisma.newsArticle.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { viewCount: 'desc' },
            take: limit,
            select: {
                id: true,
                title: true,
                titleEn: true,
                coverImage: true,
                viewCount: true,
                publishedAt: true,
            },
        })

        return articles.map((article) => ({
            id: article.id,
            title: locale === 'en' && article.titleEn ? article.titleEn : article.title,
            coverImage: article.coverImage,
            viewCount: article.viewCount,
            publishedAt: article.publishedAt,
        }))
    },

    /**
     * 管理端：获取所有文章（包含草稿）
     */
    async getAllArticles(options: {
        filters?: ArticleFilters
        page?: number
        pageSize?: number
    }) {
        const { filters = {}, page = 1, pageSize = 20 } = options

        const where: Prisma.NewsArticleWhereInput = {}

        if (filters.type) {
            where.type = filters.type
        }

        if (filters.category) {
            where.category = filters.category
        }

        if (filters.status) {
            where.status = filters.status
        }

        if (filters.source) {
            where.source = filters.source
        }

        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { summary: { contains: filters.search, mode: 'insensitive' } },
            ]
        }

        const [articles, total] = await Promise.all([
            prisma.newsArticle.findMany({
                where,
                include: {
                    rssFeed: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: [{ isTop: 'desc' }, { updatedAt: 'desc' }],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.newsArticle.count({ where }),
        ])

        return {
            articles,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        }
    },

    /**
     * 管理端：获取单篇文章详情
     */
    async getArticleByIdAdmin(id: string) {
        return prisma.newsArticle.findUnique({
            where: { id },
            include: {
                rssFeed: {
                    select: { id: true, name: true },
                },
            },
        })
    },

    /**
     * 创建文章
     */
    async createArticle(data: CreateArticleInput) {
        return prisma.newsArticle.create({
            data: {
                title: data.title,
                titleEn: data.titleEn,
                content: data.content,
                contentEn: data.contentEn,
                summary: data.summary,
                summaryEn: data.summaryEn,
                coverImage: data.coverImage,
                source: data.source,
                sourceUrl: data.sourceUrl,
                sourceId: data.sourceId,
                author: data.author,
                type: data.type || 'COMPANY',
                category: data.category,
                tags: data.tags || [],
                status: data.status || 'DRAFT',
                isTop: data.isTop || false,
                rssFeedId: data.rssFeedId,
                publishedAt: data.publishedAt,
            },
        })
    },

    /**
     * 更新文章
     */
    async updateArticle(id: string, data: UpdateArticleInput) {
        return prisma.newsArticle.update({
            where: { id },
            data,
        })
    },

    /**
     * 发布文章
     */
    async publishArticle(id: string) {
        return prisma.newsArticle.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
            },
        })
    },

    /**
     * 取消发布（设为草稿）
     */
    async unpublishArticle(id: string) {
        return prisma.newsArticle.update({
            where: { id },
            data: {
                status: 'DRAFT',
            },
        })
    },

    /**
     * 删除文章
     */
    async deleteArticle(id: string) {
        return prisma.newsArticle.delete({
            where: { id },
        })
    },

    /**
     * 批量删除
     */
    async deleteArticles(ids: string[]) {
        return prisma.newsArticle.deleteMany({
            where: { id: { in: ids } },
        })
    },

    /**
     * 设置/取消置顶
     */
    async toggleTop(id: string) {
        const article = await prisma.newsArticle.findUnique({
            where: { id },
            select: { isTop: true },
        })

        if (!article) {
            throw new NotFoundError('文章不存在')
        }

        return prisma.newsArticle.update({
            where: { id },
            data: { isTop: !article.isTop },
        })
    },

    /**
     * 检查文章是否已存在（用于去重）
     */
    async articleExists(source: string, sourceId: string): Promise<boolean> {
        const count = await prisma.newsArticle.count({
            where: { source, sourceId },
        })
        return count > 0
    },
}
