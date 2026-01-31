import { prisma } from '../config/index.js'

interface CreateFaqCategoryInput {
    name: string
    nameEn?: string
    description?: string
    sortOrder?: number
}

interface UpdateFaqCategoryInput {
    name?: string
    nameEn?: string
    description?: string
    sortOrder?: number
    isActive?: boolean
}

interface CreateFaqItemInput {
    question: string
    questionEn?: string
    answer: string
    answerEn?: string
    keywords?: string[]
    categoryId: string
    sortOrder?: number
}

interface UpdateFaqItemInput {
    question?: string
    questionEn?: string
    answer?: string
    answerEn?: string
    keywords?: string[]
    categoryId?: string
    sortOrder?: number
    isActive?: boolean
}

export const faqService = {
    // ==================== 分类管理 ====================

    /**
     * 获取所有分类
     */
    async getCategories(includeInactive = false) {
        const where = includeInactive ? {} : { isActive: true }

        return prisma.faqCategory.findMany({
            where,
            include: {
                _count: {
                    select: { items: true }
                }
            },
            orderBy: { sortOrder: 'asc' }
        })
    },

    /**
     * 获取分类详情
     */
    async getCategoryById(id: string) {
        return prisma.faqCategory.findUnique({
            where: { id },
            include: {
                items: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' }
                }
            }
        })
    },

    /**
     * 创建分类
     */
    async createCategory(data: CreateFaqCategoryInput) {
        return prisma.faqCategory.create({
            data: {
                name: data.name,
                nameEn: data.nameEn,
                description: data.description,
                sortOrder: data.sortOrder ?? 0
            }
        })
    },

    /**
     * 更新分类
     */
    async updateCategory(id: string, data: UpdateFaqCategoryInput) {
        return prisma.faqCategory.update({
            where: { id },
            data
        })
    },

    /**
     * 删除分类
     */
    async deleteCategory(id: string) {
        // 软删除
        return prisma.faqCategory.update({
            where: { id },
            data: { isActive: false }
        })
    },

    // ==================== FAQ 条目管理 ====================

    /**
     * 获取所有 FAQ 条目
     */
    async getItems(categoryId?: string, includeInactive = false) {
        const where: any = {}

        if (!includeInactive) {
            where.isActive = true
        }

        if (categoryId) {
            where.categoryId = categoryId
        }

        return prisma.faqItem.findMany({
            where,
            include: {
                category: {
                    select: { id: true, name: true, nameEn: true }
                }
            },
            orderBy: [
                { category: { sortOrder: 'asc' } },
                { sortOrder: 'asc' }
            ]
        })
    },

    /**
     * 获取 FAQ 详情
     */
    async getItemById(id: string) {
        return prisma.faqItem.findUnique({
            where: { id },
            include: {
                category: true
            }
        })
    },

    /**
     * 创建 FAQ 条目
     */
    async createItem(data: CreateFaqItemInput) {
        return prisma.faqItem.create({
            data: {
                question: data.question,
                questionEn: data.questionEn,
                answer: data.answer,
                answerEn: data.answerEn,
                keywords: data.keywords ?? [],
                categoryId: data.categoryId,
                sortOrder: data.sortOrder ?? 0
            },
            include: {
                category: true
            }
        })
    },

    /**
     * 更新 FAQ 条目
     */
    async updateItem(id: string, data: UpdateFaqItemInput) {
        return prisma.faqItem.update({
            where: { id },
            data,
            include: {
                category: true
            }
        })
    },

    /**
     * 删除 FAQ 条目
     */
    async deleteItem(id: string) {
        return prisma.faqItem.update({
            where: { id },
            data: { isActive: false }
        })
    },

    /**
     * 增加查看次数
     */
    async incrementViewCount(id: string) {
        return prisma.faqItem.update({
            where: { id },
            data: { viewCount: { increment: 1 } }
        })
    },

    /**
     * 增加有帮助次数
     */
    async incrementHelpfulCount(id: string) {
        return prisma.faqItem.update({
            where: { id },
            data: { helpfulCount: { increment: 1 } }
        })
    },

    // ==================== 搜索功能 ====================

    /**
     * 搜索 FAQ（关键词匹配）
     */
    async searchFaqs(query: string, locale: 'zh' | 'en' = 'zh') {
        const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0)

        const items = await prisma.faqItem.findMany({
            where: { isActive: true },
            include: {
                category: {
                    select: { id: true, name: true, nameEn: true }
                }
            }
        })

        // 计算匹配分数
        const scored = items.map(item => {
            let score = 0
            const question = locale === 'en' && item.questionEn ? item.questionEn.toLowerCase() : item.question.toLowerCase()
            const keywords = item.keywords.map(k => k.toLowerCase())

            for (const term of searchTerms) {
                // 问题中包含搜索词
                if (question.includes(term)) {
                    score += 10
                }
                // 关键词精确匹配
                if (keywords.includes(term)) {
                    score += 20
                }
                // 关键词部分匹配
                if (keywords.some(k => k.includes(term) || term.includes(k))) {
                    score += 5
                }
            }

            return { ...item, score }
        })

        // 过滤并排序
        return scored
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5) // 返回前5个最匹配的结果
    }
}
