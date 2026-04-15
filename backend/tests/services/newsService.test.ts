import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    newsArticle: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        count: vi.fn(),
    },
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { newsService } from '../../src/services/newsService.js'

describe('NewsService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getPublishedArticles', () => {
        it('应返回已发布文章列表', async () => {
            const mockArticles = [{ id: '1', title: 'News', titleEn: 'News EN', summary: 'Summary', viewCount: 10, publishedAt: new Date() }]
            prismaMock.newsArticle.findMany.mockResolvedValue(mockArticles)
            prismaMock.newsArticle.count.mockResolvedValue(1)

            const result = await newsService.getPublishedArticles({})
            expect(result.articles).toHaveLength(1)
            expect(result.pagination.total).toBe(1)
        })

        it('应支持英文 locale', async () => {
            const mockArticles = [{ id: '1', title: '中文', titleEn: 'English', summary: '摘要', summaryEn: 'Summary', viewCount: 0, publishedAt: new Date() }]
            prismaMock.newsArticle.findMany.mockResolvedValue(mockArticles)
            prismaMock.newsArticle.count.mockResolvedValue(1)

            const result = await newsService.getPublishedArticles({ locale: 'en' })
            expect(result.articles[0].title).toBe('English')
        })

        it('应支持按类型和分类筛选', async () => {
            prismaMock.newsArticle.findMany.mockResolvedValue([])
            prismaMock.newsArticle.count.mockResolvedValue(0)

            await newsService.getPublishedArticles({ type: 'COMPANY', category: 'news' })
            expect(prismaMock.newsArticle.findMany).toHaveBeenCalled()
        })
    })

    describe('getArticleById', () => {
        it('应返回文章详情并增加浏览量', async () => {
            const mockArticle = { id: '1', title: 'Test', content: 'Content', status: 'PUBLISHED', viewCount: 5 }
            prismaMock.newsArticle.findUnique.mockResolvedValue(mockArticle)
            prismaMock.newsArticle.update.mockResolvedValue({ ...mockArticle, viewCount: 6 })

            const result = await newsService.getArticleById('1')
            expect(result).not.toBeNull()
            expect(result!.viewCount).toBe(6)
        })

        it('未发布文章应返回 null', async () => {
            prismaMock.newsArticle.findUnique.mockResolvedValue({ id: '1', status: 'DRAFT' })

            const result = await newsService.getArticleById('1')
            expect(result).toBeNull()
        })

        it('文章不存在应返回 null', async () => {
            prismaMock.newsArticle.findUnique.mockResolvedValue(null)

            const result = await newsService.getArticleById('nonexistent')
            expect(result).toBeNull()
        })
    })

    describe('getPopularArticles', () => {
        it('应返回热门文章', async () => {
            const mockArticles = [{ id: '1', title: 'Popular', viewCount: 100, publishedAt: new Date() }]
            prismaMock.newsArticle.findMany.mockResolvedValue(mockArticles)

            const result = await newsService.getPopularArticles(5)
            expect(result).toHaveLength(1)
        })
    })

    describe('getAllArticles', () => {
        it('应返回所有文章（含草稿）', async () => {
            prismaMock.newsArticle.findMany.mockResolvedValue([])
            prismaMock.newsArticle.count.mockResolvedValue(0)

            const result = await newsService.getAllArticles({})
            expect(result.pagination).toBeDefined()
        })

        it('应支持搜索', async () => {
            prismaMock.newsArticle.findMany.mockResolvedValue([])
            prismaMock.newsArticle.count.mockResolvedValue(0)

            await newsService.getAllArticles({ filters: { search: 'test' } })
            expect(prismaMock.newsArticle.findMany).toHaveBeenCalled()
        })

        it('应支持状态和来源筛选', async () => {
            prismaMock.newsArticle.findMany.mockResolvedValue([])
            prismaMock.newsArticle.count.mockResolvedValue(0)

            await newsService.getAllArticles({ filters: { status: 'DRAFT', source: 'rss', type: 'INDUSTRY', category: 'tech' } })
            expect(prismaMock.newsArticle.findMany).toHaveBeenCalled()
        })
    })

    describe('getArticleByIdAdmin', () => {
        it('应返回文章详情', async () => {
            const mockArticle = { id: '1', title: 'Test' }
            prismaMock.newsArticle.findUnique.mockResolvedValue(mockArticle)

            const result = await newsService.getArticleByIdAdmin('1')
            expect(result).toEqual(mockArticle)
        })
    })

    describe('createArticle', () => {
        it('应创建文章', async () => {
            const mockCreated = { id: '1', title: 'New Article' }
            prismaMock.newsArticle.create.mockResolvedValue(mockCreated)

            const result = await newsService.createArticle({ title: 'New Article', content: 'Content', source: 'manual' })
            expect(result).toEqual(mockCreated)
        })
    })

    describe('updateArticle', () => {
        it('应更新文章', async () => {
            prismaMock.newsArticle.update.mockResolvedValue({ id: '1', title: 'Updated' })

            const result = await newsService.updateArticle('1', { title: 'Updated' })
            expect(result.title).toBe('Updated')
        })
    })

    describe('publishArticle', () => {
        it('应发布文章', async () => {
            prismaMock.newsArticle.update.mockResolvedValue({ id: '1', status: 'PUBLISHED' })

            const result = await newsService.publishArticle('1')
            expect(result.status).toBe('PUBLISHED')
        })
    })

    describe('unpublishArticle', () => {
        it('应取消发布', async () => {
            prismaMock.newsArticle.update.mockResolvedValue({ id: '1', status: 'DRAFT' })

            const result = await newsService.unpublishArticle('1')
            expect(result.status).toBe('DRAFT')
        })
    })

    describe('deleteArticle', () => {
        it('应删除文章', async () => {
            prismaMock.newsArticle.delete.mockResolvedValue({ id: '1' })

            await newsService.deleteArticle('1')
            expect(prismaMock.newsArticle.delete).toHaveBeenCalledWith({ where: { id: '1' } })
        })
    })

    describe('deleteArticles', () => {
        it('应批量删除文章', async () => {
            prismaMock.newsArticle.deleteMany.mockResolvedValue({ count: 3 })

            await newsService.deleteArticles(['1', '2', '3'])
            expect(prismaMock.newsArticle.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['1', '2', '3'] } } })
        })
    })

    describe('toggleTop', () => {
        it('应切换置顶状态', async () => {
            prismaMock.newsArticle.findUnique.mockResolvedValue({ id: '1', isTop: false })
            prismaMock.newsArticle.update.mockResolvedValue({ id: '1', isTop: true })

            const result = await newsService.toggleTop('1')
            expect(result.isTop).toBe(true)
        })

        it('文章不存在时抛出 NotFoundError', async () => {
            prismaMock.newsArticle.findUnique.mockResolvedValue(null)

            await expect(newsService.toggleTop('nonexistent')).rejects.toThrow('文章不存在')
        })
    })

    describe('articleExists', () => {
        it('文章存在时返回 true', async () => {
            prismaMock.newsArticle.count.mockResolvedValue(1)

            const result = await newsService.articleExists('rss', 'source-1')
            expect(result).toBe(true)
        })

        it('文章不存在时返回 false', async () => {
            prismaMock.newsArticle.count.mockResolvedValue(0)

            const result = await newsService.articleExists('rss', 'nonexistent')
            expect(result).toBe(false)
        })
    })
})
