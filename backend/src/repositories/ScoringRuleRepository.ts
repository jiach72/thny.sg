import { BaseRepository } from './BaseRepository.js'
import type { ScoringRule } from '@prisma/client'

/**
 * ScoringRule 创建输入
 */
export interface CreateScoringRuleInput {
    name: string
    description?: string
    field: string
    operator: string
    value: string | null
    points: number
    isActive?: boolean
    priority?: number
}

/**
 * ScoringRule 更新输入
 */
export interface UpdateScoringRuleInput {
    name?: string
    description?: string
    field?: string
    operator?: string
    value?: string | null
    points?: number
    isActive?: boolean
    priority?: number
}

/**
 * ScoringRule Repository
 * 封装评分规则相关的数据库操作
 */
export class ScoringRuleRepository extends BaseRepository<ScoringRule, CreateScoringRuleInput, UpdateScoringRuleInput> {
    protected modelName = 'scoringRule'

    /**
     * 获取所有活跃规则（按优先级排序）
     */
    async findActiveRules(): Promise<ScoringRule[]> {
        return this.model.findMany({
            where: { isActive: true },
            orderBy: { priority: 'asc' }
        })
    }

    /**
     * 获取所有规则
     */
    async findAllRules(includeInactive: boolean = false): Promise<ScoringRule[]> {
        const where = includeInactive ? {} : { isActive: true }

        return this.model.findMany({
            where,
            orderBy: { priority: 'asc' }
        })
    }

    /**
     * 根据字段获取规则
     */
    async findByField(field: string): Promise<ScoringRule[]> {
        return this.model.findMany({
            where: { field, isActive: true },
            orderBy: { priority: 'asc' }
        })
    }

    /**
     * 批量创建规则
     */
    async createBatch(rules: CreateScoringRuleInput[]): Promise<{ count: number }> {
        return this.model.createMany({
            data: rules,
            skipDuplicates: true
        })
    }

    /**
     * 启用/禁用规则
     */
    async toggleActive(id: string, isActive: boolean): Promise<ScoringRule> {
        return this.model.update({
            where: { id },
            data: { isActive }
        })
    }

    /**
     * 批量启用
     */
    async activateAll(): Promise<{ count: number }> {
        return this.model.updateMany({
            data: { isActive: true }
        })
    }

    /**
     * 批量禁用
     */
    async deactivateAll(): Promise<{ count: number }> {
        return this.model.updateMany({
            data: { isActive: false }
        })
    }

    /**
     * 更新优先级
     */
    async updatePriority(id: string, priority: number): Promise<ScoringRule> {
        return this.model.update({
            where: { id },
            data: { priority }
        })
    }

    /**
     * 检查规则名称是否存在
     */
    async nameExists(name: string, excludeId?: string): Promise<boolean> {
        const where: any = { name }
        if (excludeId) {
            where.id = { not: excludeId }
        }

        const count = await this.model.count({ where })
        return count > 0
    }
}

// 单例导出
export const scoringRuleRepository = new ScoringRuleRepository()
export default scoringRuleRepository
