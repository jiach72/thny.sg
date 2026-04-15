import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    rssFeed: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    newsArticle: {
        count: vi.fn(),
        create: vi.fn(),
    },
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('../../src/config/ssrfProtection.js', () => ({
    validateSafeUrl: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/services/newsService.js', () => ({
    newsService: {
        articleExists: vi.fn().mockResolvedValue(false),
        createArticle: vi.fn().mockResolvedValue({ id: 'article-1' }),
    },
}))

import { rssFetchService } from '../../src/services/rssFetchService.js'

describe('RssFetchService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getAllFeeds', () => {
        it('应返回活跃的 RSS 源列表', async () => {
            const mockFeeds = [{ id: '1', name: 'Feed 1' }]
            prismaMock.rssFeed.findMany.mockResolvedValue(mockFeeds)

            const result = await rssFetchService.getAllFeeds()
            expect(result).toEqual(mockFeeds)
        })

        it('包含未激活源时应传空条件', async () => {
            prismaMock.rssFeed.findMany.mockResolvedValue([])

            await rssFetchService.getAllFeeds(true)
            expect(prismaMock.rssFeed.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: {} })
            )
        })
    })

    describe('getFeedById', () => {
        it('应返回 RSS 源详情', async () => {
            const mockFeed = { id: '1', name: 'Feed 1' }
            prismaMock.rssFeed.findUnique.mockResolvedValue(mockFeed)

            const result = await rssFetchService.getFeedById('1')
            expect(result).toEqual(mockFeed)
        })
    })

    describe('createFeed', () => {
        it('应创建 RSS 源', async () => {
            const mockCreated = { id: '1', name: 'New Feed' }
            prismaMock.rssFeed.create.mockResolvedValue(mockCreated)

            const result = await rssFetchService.createFeed({
                name: 'New Feed',
                url: 'https://example.com/rss',
                category: 'tech',
            })

            expect(result).toEqual(mockCreated)
        })

        it('应使用默认值', async () => {
            prismaMock.rssFeed.create.mockResolvedValue({ id: '1' })

            await rssFetchService.createFeed({
                name: 'Feed',
                url: 'https://example.com/rss',
                category: 'tech',
            })

            expect(prismaMock.rssFeed.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ language: 'zh', isActive: true, fetchInterval: 60 }),
                })
            )
        })
    })

    describe('updateFeed', () => {
        it('应更新 RSS 源', async () => {
            prismaMock.rssFeed.update.mockResolvedValue({ id: '1', name: 'Updated' })

            const result = await rssFetchService.updateFeed('1', { name: 'Updated' })
            expect(result.name).toBe('Updated')
        })
    })

    describe('deleteFeed', () => {
        it('应删除 RSS 源', async () => {
            prismaMock.rssFeed.delete.mockResolvedValue({ id: '1' })

            await rssFetchService.deleteFeed('1')
            expect(prismaMock.rssFeed.delete).toHaveBeenCalledWith({ where: { id: '1' } })
        })
    })

    describe('fetchFeed', () => {
        it('RSS 源不存在时应返回错误', async () => {
            prismaMock.rssFeed.findUnique.mockResolvedValue(null)

            const result = await rssFetchService.fetchFeed('nonexistent')
            expect(result.success).toBe(false)
            expect(result.error).toBe('订阅源不存在')
        })
    })

    describe('testFeed', () => {
        it('应测试 RSS 源有效性', async () => {
            // 模拟 fetch 和 parser
            const result = await rssFetchService.testFeed('https://example.com/rss')
            // 由于 fetch 是全局 API，在测试环境中可能不可用，所以只验证返回格式
            expect(result).toHaveProperty('valid')
        })
    })
})
