import apiClient from './apiClient'

// ==================== 评分规则管理 ====================

export interface ScoringRule {
    id: string
    name: string
    description?: string
    field: string
    operator: string
    value?: string
    score: number
    isActive: boolean
    sortOrder: number
    createdAt: string
    updatedAt: string
}

export interface CreateRuleInput {
    name: string
    description?: string
    field: string
    operator: string
    value?: string
    score: number
    sortOrder?: number
}

export interface UpdateRuleInput {
    name?: string
    description?: string
    field?: string
    operator?: string
    value?: string
    score?: number
    isActive?: boolean
    sortOrder?: number
}

export interface ScoreResult {
    score: number
    breakdown: Record<string, number>
    matchedRules: string[]
}

// 获取所有规则
export const getRules = (includeInactive = false): Promise<ScoringRule[]> =>
    apiClient.get('/scoring/rules', {
        params: { includeInactive }
    })

// 获取规则详情
export const getRuleById = (id: string): Promise<ScoringRule> =>
    apiClient.get(`/scoring/rules/${id}`)

// 创建规则
export const createRule = (data: CreateRuleInput): Promise<ScoringRule> =>
    apiClient.post('/scoring/rules', data)

// 更新规则
export const updateRule = (id: string, data: UpdateRuleInput): Promise<ScoringRule> =>
    apiClient.put(`/scoring/rules/${id}`, data)

// 删除规则
export const deleteRule = (id: string): Promise<void> =>
    apiClient.delete(`/scoring/rules/${id}`)

// 计算线索评分
export const calculateLeadScore = (leadId: string): Promise<ScoreResult> =>
    apiClient.post(`/scoring/leads/${leadId}/calculate`)

// 批量更新评分
export const batchUpdateScores = (): Promise<{ updated: number; failed: number }> =>
    apiClient.post('/scoring/batch')

// 初始化默认规则
export const seedDefaultRules = (): Promise<void> =>
    apiClient.post('/scoring/seed')

export default {
    getRules,
    getRuleById,
    createRule,
    updateRule,
    deleteRule,
    calculateLeadScore,
    batchUpdateScores,
    seedDefaultRules
}

