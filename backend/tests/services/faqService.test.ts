import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1. Hoist the mock object creation
const prismaMock = vi.hoisted(() => ({
    faqCategory: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    faqItem: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
}))

// 2. Mock the module using the hoisted variable
vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

// 3. Import service AFTER mocking
import { faqService } from '../../src/services/faqService'

describe('FaqService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getCategories', () => {
        it('should return active categories by default', async () => {
            const mockCategories = [
                { id: 'cat-1', name: '公司注册', isActive: true, _count: { items: 5 } },
                { id: 'cat-2', name: '签证服务', isActive: true, _count: { items: 3 } },
            ]

            prismaMock.faqCategory.findMany.mockResolvedValue(mockCategories as any)

            const result = await faqService.getCategories()

            expect(result).toHaveLength(2)
            expect(prismaMock.faqCategory.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { isActive: true },
                })
            )
        })

        it('should include inactive categories when flag is true', async () => {
            prismaMock.faqCategory.findMany.mockResolvedValue([])

            await faqService.getCategories(true)

            expect(prismaMock.faqCategory.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {},
                })
            )
        })
    })

    describe('createCategory', () => {
        it('should create a new category', async () => {
            const input = { name: '税务咨询', nameEn: 'Tax Consultation' }
            const mockCreated = { id: 'cat-new', ...input, isActive: true, sortOrder: 0 }

            prismaMock.faqCategory.create.mockResolvedValue(mockCreated as any)

            const result = await faqService.createCategory(input)

            expect(result.id).toBe('cat-new')
            expect(result.name).toBe('税务咨询')
            expect(prismaMock.faqCategory.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        name: '税务咨询',
                        nameEn: 'Tax Consultation',
                    }),
                })
            )
        })
    })

    describe('searchFaqs', () => {
        it('should return matching FAQs sorted by score', async () => {
            const mockItems = [
                {
                    id: 'faq-1',
                    question: '如何注册新加坡公司？',
                    questionEn: 'How to register a Singapore company?',
                    answer: '注册步骤...',
                    keywords: ['注册', '公司', 'singapore'],
                    isActive: true,
                    category: { id: 'cat-1', name: '公司注册' },
                },
                {
                    id: 'faq-2',
                    question: '新加坡公司税率是多少？',
                    questionEn: 'What is Singapore corporate tax rate?',
                    answer: '税率说明...',
                    keywords: ['税率', '税务'],
                    isActive: true,
                    category: { id: 'cat-2', name: '税务' },
                },
            ]

            prismaMock.faqItem.findMany.mockResolvedValue(mockItems as any)

            const result = await faqService.searchFaqs('公司')

            // 应该匹配到至少一个结果（包含"公司"关键词）
            expect(result.length).toBeGreaterThan(0)
            expect(result[0].score).toBeGreaterThan(0)
        })

        it('should return empty array for no matches', async () => {
            prismaMock.faqItem.findMany.mockResolvedValue([
                {
                    id: 'faq-1',
                    question: '如何注册公司？',
                    keywords: ['注册'],
                    isActive: true,
                    category: { id: 'cat-1', name: '公司注册' },
                },
            ] as any)

            const result = await faqService.searchFaqs('完全不相关的词')

            expect(result).toHaveLength(0)
        })
    })

    describe('createItem', () => {
        it('should create a new FAQ item', async () => {
            const input = {
                question: '新加坡EP申请条件？',
                answer: '申请条件包括...',
                categoryId: 'cat-1',
            }
            const mockCreated = {
                id: 'faq-new',
                ...input,
                keywords: [],
                isActive: true,
                sortOrder: 0,
                category: { id: 'cat-1', name: '签证服务' },
            }

            prismaMock.faqItem.create.mockResolvedValue(mockCreated as any)

            const result = await faqService.createItem(input)

            expect(result.id).toBe('faq-new')
            expect(prismaMock.faqItem.create).toHaveBeenCalled()
        })
    })

    describe('incrementViewCount', () => {
        it('should increment view count', async () => {
            prismaMock.faqItem.update.mockResolvedValue({ id: 'faq-1', viewCount: 11 } as any)

            await faqService.incrementViewCount('faq-1')

            expect(prismaMock.faqItem.update).toHaveBeenCalledWith({
                where: { id: 'faq-1' },
                data: { viewCount: { increment: 1 } },
            })
        })
    })

    describe('deleteItem', () => {
        it('should soft delete FAQ item', async () => {
            prismaMock.faqItem.update.mockResolvedValue({ id: 'faq-1', isActive: false } as any)

            await faqService.deleteItem('faq-1')

            expect(prismaMock.faqItem.update).toHaveBeenCalledWith({
                where: { id: 'faq-1' },
                data: { isActive: false },
            })
        })
    })
})
