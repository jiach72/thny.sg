import { NotFoundError } from '../middlewares/errorHandler.js'
import { prisma } from '../config/index.js'
import type { Lead, ScoringRule } from '@prisma/client'
import logger from '../config/logger.js'

interface ScoreResult {
    score: number
    breakdown: Record<string, number>
    matchedRules: string[]
}

interface CreateRuleInput {
    name: string
    description?: string
    field: string
    operator: string
    value?: string
    score: number
    sortOrder?: number
}

interface UpdateRuleInput {
    name?: string
    description?: string
    field?: string
    operator?: string
    value?: string
    score?: number
    isActive?: boolean
    sortOrder?: number
}

export const scoringService = {
    // ==================== 规则管理 ====================

    /**
     * 获取所有评分规则
     */
    async getRules(includeInactive = false) {
        const where = includeInactive ? {} : { isActive: true }

        return prisma.scoringRule.findMany({
            where,
            orderBy: { sortOrder: 'asc' }
        })
    },

    /**
     * 获取规则详情
     */
    async getRuleById(id: string) {
        return prisma.scoringRule.findUnique({
            where: { id }
        })
    },

    /**
     * 创建评分规则
     */
    async createRule(data: CreateRuleInput) {
        return prisma.scoringRule.create({
            data: {
                name: data.name,
                description: data.description,
                field: data.field,
                operator: data.operator,
                value: data.value,
                score: data.score,
                sortOrder: data.sortOrder ?? 0
            }
        })
    },

    /**
     * 更新评分规则
     */
    async updateRule(id: string, data: UpdateRuleInput) {
        return prisma.scoringRule.update({
            where: { id },
            data
        })
    },

    /**
     * 删除评分规则
     */
    async deleteRule(id: string) {
        return prisma.scoringRule.delete({
            where: { id }
        })
    },

    // ==================== 评分计算 ====================

    /**
     * 计算单个线索的评分
     */
    async calculateScore(lead: Lead): Promise<ScoreResult> {
        const rules = await this.getRules()
        let totalScore = 0
        const breakdown: Record<string, number> = {}
        const matchedRules: string[] = []

        for (const rule of rules) {
            if (this.evaluateRule(lead, rule)) {
                totalScore += rule.score
                breakdown[rule.name] = rule.score
                matchedRules.push(rule.id)
            }
        }

        return { score: totalScore, breakdown, matchedRules }
    },

    /**
     * 评估单条规则是否匹配
     */
    evaluateRule(lead: Lead, rule: ScoringRule): boolean {
        const fieldValue = this.getFieldValue(lead, rule.field)
        const ruleValue = rule.value ? this.parseValue(rule.value) : null

        switch (rule.operator) {
            case 'exists':
                // 字段存在且非空
                return fieldValue != null && fieldValue !== '' &&
                    (Array.isArray(fieldValue) ? fieldValue.length > 0 : true)

            case 'not_exists':
                // 字段不存在或为空
                return fieldValue == null || fieldValue === '' ||
                    (Array.isArray(fieldValue) && fieldValue.length === 0)

            case 'eq':
                // 等于
                return fieldValue === ruleValue

            case 'neq':
                // 不等于
                return fieldValue !== ruleValue

            case 'gt':
                // 大于
                return Number(fieldValue) > Number(ruleValue)

            case 'gte':
                // 大于等于
                return Number(fieldValue) >= Number(ruleValue)

            case 'lt':
                // 小于
                return Number(fieldValue) < Number(ruleValue)

            case 'lte':
                // 小于等于
                return Number(fieldValue) <= Number(ruleValue)

            case 'contains':
                // 包含（字符串或数组）
                if (Array.isArray(fieldValue)) {
                    return fieldValue.some(v =>
                        String(v).toLowerCase().includes(String(ruleValue).toLowerCase())
                    )
                }
                return String(fieldValue).toLowerCase().includes(String(ruleValue).toLowerCase())

            case 'in':
                // 在列表中（ruleValue 应为数组）
                if (!Array.isArray(ruleValue)) return false
                return ruleValue.includes(fieldValue)

            case 'array_includes':
                // 数组包含指定值
                if (!Array.isArray(fieldValue)) return false
                return fieldValue.includes(ruleValue)

            case 'array_length_gt':
                // 数组长度大于
                if (!Array.isArray(fieldValue)) return false
                return fieldValue.length > Number(ruleValue)

            default:
                return false
        }
    },

    /**
     * 获取字段值（支持嵌套字段）
     */
    getFieldValue(lead: Lead, field: string): unknown {
        const parts = field.split('.')
        let value: unknown = lead

        for (const part of parts) {
            if (value == null) return null
            value = (value as Record<string, unknown>)[part]
        }

        return value
    },

    /**
     * 解析规则值（JSON 格式）
     */
    parseValue(value: string): unknown {
        try {
            return JSON.parse(value)
        } catch {
            return value
        }
    },

    /**
     * 更新线索评分
     */
    async updateLeadScore(leadId: string): Promise<Lead> {
        const lead = await prisma.lead.findUnique({
            where: { id: leadId }
        })

        if (!lead) {
            throw new NotFoundError('线索不存在')
        }

        const { score, breakdown } = await this.calculateScore(lead)

        return prisma.lead.update({
            where: { id: leadId },
            data: {
                score,
                scoreBreakdown: breakdown,
                scoreUpdatedAt: new Date()
            }
        })
    },

    /**
     * 批量更新所有线索评分
     */
    async batchUpdateScores(): Promise<{ updated: number; failed: number }> {
        const leads = await prisma.lead.findMany({
            where: {
                status: { notIn: ['LOST', 'CONVERTED'] }
            }
        })

        let updated = 0
        let failed = 0

        for (const lead of leads) {
            try {
                await this.updateLeadScore(lead.id)
                updated++
            } catch {
                failed++
            }
        }

        return { updated, failed }
    },

    // ==================== 预置规则种子数据 ====================

    /**
     * 初始化默认评分规则
     */
    async seedDefaultRules(): Promise<void> {
        const defaultRules: CreateRuleInput[] = [
            // 联系方式完整度
            { name: '有邮箱', field: 'email', operator: 'exists', score: 10, sortOrder: 1 },
            { name: '有电话', field: 'phone', operator: 'exists', score: 10, sortOrder: 2 },

            // 公司信息
            { name: '有公司名', field: 'companyName', operator: 'exists', score: 10, sortOrder: 3 },

            // 预算
            { name: '有预算信息', field: 'budgetRange', operator: 'exists', score: 15, sortOrder: 4 },
            { name: '高预算', field: 'budgetRange', operator: 'in', value: '["100万以上","500万以上","1000万以上"]', score: 20, sortOrder: 5 },

            // 意向服务  
            { name: '高价值服务意向', field: 'serviceTypes', operator: 'array_includes', value: '"family_office"', score: 20, sortOrder: 6 },
            { name: 'VCC基金意向', field: 'serviceTypes', operator: 'array_includes', value: '"vcc_fund"', score: 20, sortOrder: 7 },

            // 来源渠道
            { name: '官网咨询', field: 'sourceChannel', operator: 'eq', value: '"website_form"', score: 10, sortOrder: 8 },
            { name: '转介绍', field: 'sourceChannel', operator: 'eq', value: '"referral"', score: 15, sortOrder: 9 },

            // 状态相关
            { name: '已联系', field: 'lastContactedAt', operator: 'exists', score: 5, sortOrder: 10 },
            { name: '多服务意向', field: 'serviceTypes', operator: 'array_length_gt', value: '2', score: 10, sortOrder: 11 },
        ]

        const existingCount = await prisma.scoringRule.count()
        if (existingCount > 0) {
            logger.info('评分规则已存在，跳过初始化')
            return
        }

        for (const rule of defaultRules) {
            await this.createRule(rule)
        }

        logger.info(`已创建 ${defaultRules.length} 条默认评分规则`)
    }
}

export default scoringService
