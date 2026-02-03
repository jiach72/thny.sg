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

        const items = await prisma.faqItem.findMany({
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
        console.log(`[FAQ Service] getItems found ${items.length} items. Filter: ${JSON.stringify(where)}`)
        return items
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

    /**
     * searchFaqs - 优化版本，支持中文分词
     */
    async searchFaqs(query: string, locale: 'zh' | 'en' = 'zh') {
        // 对中文进行字符级分词，对英文进行空格分词
        const normalizedQuery = query.toLowerCase().trim()

        // 中文分词：将连续中文字符拆分为 2-3 字的词组
        const chineseChars = normalizedQuery.match(/[\u4e00-\u9fa5]+/g) || []
        const chineseTerms: string[] = []
        for (const chars of chineseChars) {
            // 添加完整词
            chineseTerms.push(chars)
            // 添加 2 字词组
            for (let i = 0; i < chars.length - 1; i++) {
                chineseTerms.push(chars.substring(i, i + 2))
            }
        }

        // 英文分词：按空格分割
        const englishTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 1 && !/[\u4e00-\u9fa5]/.test(t))

        const searchTerms = [...new Set([...chineseTerms, ...englishTerms])]

        console.log(`[FAQ Search] 用户查询: "${query}"`)
        console.log(`[FAQ Search] 分词结果: ${JSON.stringify(searchTerms)}`)

        const items = await prisma.faqItem.findMany({
            where: { isActive: true },
            include: {
                category: {
                    select: { id: true, name: true, nameEn: true }
                }
            }
        })

        console.log(`[FAQ Search] 数据库中共有 ${items.length} 条 FAQ`)

        // 计算匹配分数
        const scored = items.map(item => {
            let score = 0
            const question = locale === 'en' && item.questionEn ? item.questionEn.toLowerCase() : item.question.toLowerCase()
            const answer = locale === 'en' && item.answerEn ? item.answerEn.toLowerCase() : item.answer.toLowerCase()
            const keywords = item.keywords.map(k => k.toLowerCase())

            for (const term of searchTerms) {
                // 问题匹配
                if (question.includes(term)) score += 10
                // 答案匹配（权重较低）
                if (answer.includes(term)) score += 3
                // 关键词精确匹配
                if (keywords.includes(term)) score += 20
                // 关键词模糊匹配
                if (keywords.some(k => k.includes(term) || term.includes(k))) score += 5
            }

            return { ...item, score }
        })

        const results = scored
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5) // 返回前5个最匹配的结果

        console.log(`[FAQ Search] 匹配结果: ${results.length} 条, 最高分: ${results[0]?.score || 0}`)
        if (results.length > 0) {
            console.log(`[FAQ Search] Top FAQ: "${results[0].question}" (分数: ${results[0].score})`)
        }

        return results
    },

    // ==================== 批量导入 ====================

    /**
     * 从 Excel/CSV Buffer 导入数据
     */
    async importFromBuffer(buffer: Buffer) {
        const XLSX_MODULE = await import('xlsx')
        // @ts-ignore
        const XLSX = XLSX_MODULE.default || XLSX_MODULE

        const workbook = XLSX.read(buffer, { type: 'buffer' })

        // 读取第一个 sheet
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // 转换为 JSON
        const rows = XLSX.utils.sheet_to_json(worksheet) as any[]

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        }

        // 缓存分类 ID map: name -> id
        const categoryMap = new Map<string, string>()

        // 获取现有分类
        const existingCats = await prisma.faqCategory.findMany()
        existingCats.forEach(cat => categoryMap.set(cat.name, cat.id))

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            const lineNum = i + 2 // Excel 行号（表头为1）

            try {
                // 必填字段检查
                if (!row['Category'] && !row['分类']) throw new Error('缺少分类')
                if (!row['Question'] && !row['问题']) throw new Error('缺少问题')
                if (!row['Answer'] && !row['答案']) throw new Error('缺少答案')

                const catName = String(row['Category'] || row['分类']).trim()
                const question = String(row['Question'] || row['问题']).trim()
                const answer = String(row['Answer'] || row['答案']).trim()
                const questionEn = String(row['QuestionEn'] || row['英文问题'] || '').trim()
                const answerEn = String(row['AnswerEn'] || row['英文答案'] || '').trim()
                const keywordsData = (row['Keywords'] || row['关键词'] || '')

                // 处理 keywords (支持逗号、中文逗号、空格分隔)
                const keywords = String(keywordsData)
                    .split(/[,\uFF0C\s]+/)
                    .map(k => k.trim())
                    .filter(k => k.length > 0)

                // 获取或创建分类
                let catId = categoryMap.get(catName)
                if (!catId) {
                    const newCat = await prisma.faqCategory.create({
                        data: { name: catName }
                    })
                    catId = newCat.id
                    categoryMap.set(catName, catId)
                }

                // 创建 FAQ
                await prisma.faqItem.create({
                    data: {
                        question,
                        questionEn: questionEn || null,
                        answer,
                        answerEn: answerEn || null,
                        keywords,
                        categoryId: catId,
                        sortOrder: 100 // 默认排序
                    }
                })

                results.success++
            } catch (error: any) {
                results.failed++
                results.errors.push(`第 ${lineNum} 行: ${error.message}`)
            }
        }

        return results
    }
}
