// FAQ 分类
export interface FaqCategory {
    id: string
    name: string
    nameEn?: string
    description?: string
    sortOrder: number
    isActive: boolean
    createdAt: string
    updatedAt: string
    // 关联数据
    items?: FaqItem[]
    _count?: { items: number }
}

// FAQ 条目
export interface FaqItem {
    id: string
    question: string
    questionEn?: string
    answer: string
    answerEn?: string
    keywords: string[]
    sortOrder: number
    isActive: boolean
    viewCount: number
    helpfulCount: number
    categoryId: string
    createdAt: string
    updatedAt: string
    // 关联数据
    category?: FaqCategory
}

// 创建 FAQ 请求
export interface CreateFaqItemPayload {
    question: string
    questionEn?: string
    answer: string
    answerEn?: string
    keywords?: string[]
    categoryId: string
    sortOrder?: number
}

// 更新 FAQ 请求
export interface UpdateFaqItemPayload {
    question?: string
    questionEn?: string
    answer?: string
    answerEn?: string
    keywords?: string[]
    categoryId?: string
    sortOrder?: number
    isActive?: boolean
}

// 创建 FAQ 分类请求
export interface CreateFaqCategoryPayload {
    name: string
    nameEn?: string
    description?: string
    sortOrder?: number
}
