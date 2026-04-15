import { ValidationError } from '../middlewares/errorHandler.js'
import { prisma } from '../config/index.js'
import { Prisma } from '@prisma/client'
import logger from '../config/logger.js'

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
        const where: Prisma.FaqItemWhereInput = {}

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
        logger.debug(`getItems 查询到 ${items.length} 条 FAQ`, { filter: where, context: 'faqService' })
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

        logger.debug(`FAQ 搜索: "${query}"`, { searchTerms, context: 'faqSearch' })

        const items = await prisma.faqItem.findMany({
            where: { isActive: true },
            include: {
                category: {
                    select: { id: true, name: true, nameEn: true }
                }
            }
        })

        logger.debug(`FAQ 搜索数据库匹配`, { totalItems: items.length, context: 'faqSearch' })

        // 计算匹配分数
        const scored = items.map(item => {
            let score = 0
            const question = locale === 'en' && item.questionEn ? item.questionEn.toLowerCase() : item.question.toLowerCase()
            const answer = (locale === 'en' && item.answerEn ? item.answerEn : item.answer) || ''
            const answerLower = answer.toLowerCase()
            const keywords = item.keywords.map(k => k.toLowerCase())

            for (const term of searchTerms) {
                // 问题匹配
                if (question.includes(term)) score += 10
                // 答案匹配（权重较低）
                if (answerLower.includes(term)) score += 3
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

        logger.debug(`FAQ 搜索结果`, { count: results.length, topScore: results[0]?.score || 0, context: 'faqSearch' })

        return results
    },

    // ==================== 批量导入 ====================

    /**
     * 从 Excel/CSV Buffer 导入数据（使用 ExcelJS）
     */
    async importFromBuffer(buffer: Buffer) {
        const ExcelJS = await import('exceljs')
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer as unknown as ArrayBuffer)

        // 读取第一个 sheet
        const worksheet = workbook.worksheets[0]
        if (!worksheet) {
            throw new ValidationError('Excel 文件中没有工作表')
        }

        // 读取表头（第一行）
        const headers: string[] = []
        const headerRow = worksheet.getRow(1)
        headerRow.eachCell((cell, colNumber) => {
            headers[colNumber] = String(cell.value || '').trim()
        })

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

        // 遍历数据行（从第2行开始，跳过表头）
        for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
            const excelRow = worksheet.getRow(rowIndex)
            const lineNum = rowIndex // Excel 行号

            // 构建 key-value 行数据
            const row: Record<string, string> = {}
            excelRow.eachCell((cell, colNumber) => {
                const header = headers[colNumber]
                if (header) {
                    row[header] = String(cell.value || '').trim()
                }
            })

            // 跳过空行
            if (Object.values(row).every(v => !v)) continue

            try {
                // 必填字段检查
                if (!row['Category'] && !row['分类']) throw new ValidationError('缺少分类')
                if (!row['Question'] && !row['问题']) throw new ValidationError('缺少问题')
                if (!row['Answer'] && !row['答案']) throw new ValidationError('缺少答案')

                const catName = (row['Category'] || row['分类']).trim()
                const question = (row['Question'] || row['问题']).trim()
                const answer = (row['Answer'] || row['答案']).trim()
                const questionEn = (row['QuestionEn'] || row['英文问题'] || '').trim()
                const answerEn = (row['AnswerEn'] || row['英文答案'] || '').trim()
                const keywordsData = row['Keywords'] || row['关键词'] || ''

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
            } catch (error: unknown) {
                results.failed++
                const msg = error instanceof Error ? error.message : '未知错误'
                results.errors.push(`第 ${lineNum} 行: ${msg}`)
            }
        }

        return results
    }
}
