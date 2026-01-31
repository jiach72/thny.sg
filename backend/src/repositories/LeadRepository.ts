import { BaseRepository, PaginatedResult, PaginationOptions } from './BaseRepository.js'
import type { Lead, LeadStatus, Prisma } from '@prisma/client'

/**
 * Lead 创建输入
 */
export interface CreateLeadInput {
    contactName: string
    email?: string
    phone?: string
    companyName?: string
    country?: string
    serviceTypes?: string[]
    budgetRange?: string
    sourceChannel: string
    inquiryMessage?: string
    tags?: string[]
}

/**
 * Lead 更新输入
 */
export interface UpdateLeadInput {
    contactName?: string
    email?: string
    phone?: string
    companyName?: string
    country?: string
    serviceTypes?: string[]
    budgetRange?: string
    inquiryMessage?: string
    status?: LeadStatus
    tags?: string[]
    score?: number
    scoreBreakdown?: any
    scoreUpdatedAt?: Date
    lastContactedAt?: Date
    assignedToId?: string
}

/**
 * Lead 过滤条件
 */
export interface LeadFilters {
    status?: LeadStatus
    assignedToId?: string
    sourceChannel?: string
    country?: string
    tags?: string[]
    search?: string
    scoreMin?: number
    scoreMax?: number
}

/**
 * Lead Repository
 * 封装线索相关的数据库操作
 */
export class LeadRepository extends BaseRepository<Lead, CreateLeadInput, UpdateLeadInput> {
    protected modelName = 'lead'

    /**
     * 默认关联查询
     */
    private defaultInclude = {
        assignedTo: {
            select: { id: true, name: true, email: true }
        }
    }

    /**
     * 详情关联查询
     */
    private detailInclude = {
        assignedTo: {
            select: { id: true, name: true, email: true }
        },
        activities: {
            orderBy: { createdAt: 'desc' as const },
            take: 10
        },
        tasks: {
            where: { status: { notIn: ['DONE', 'CANCELLED'] } },
            orderBy: { dueDate: 'asc' as const }
        },
        appointments: {
            orderBy: { startTime: 'desc' as const },
            take: 5
        }
    }

    /**
     * 构建过滤条件
     */
    private buildWhereClause(filters: LeadFilters): Prisma.LeadWhereInput {
        const where: Prisma.LeadWhereInput = {}

        if (filters.status) {
            where.status = filters.status
        }

        if (filters.assignedToId) {
            where.assignedToId = filters.assignedToId
        }

        if (filters.sourceChannel) {
            where.sourceChannel = filters.sourceChannel
        }

        if (filters.country) {
            where.country = filters.country
        }

        if (filters.tags && filters.tags.length > 0) {
            where.tags = { hasSome: filters.tags }
        }

        if (filters.scoreMin !== undefined || filters.scoreMax !== undefined) {
            where.score = {}
            if (filters.scoreMin !== undefined) {
                where.score.gte = filters.scoreMin
            }
            if (filters.scoreMax !== undefined) {
                where.score.lte = filters.scoreMax
            }
        }

        if (filters.search) {
            where.OR = [
                { contactName: { contains: filters.search, mode: 'insensitive' } },
                { companyName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
                { phone: { contains: filters.search, mode: 'insensitive' } }
            ]
        }

        return where
    }

    /**
     * 分页查询线索列表
     */
    async findLeads(
        filters: LeadFilters,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<Lead>> {
        const where = this.buildWhereClause(filters)
        return this.findPaginated(where, pagination, this.defaultInclude)
    }

    /**
     * 获取线索详情（含关联数据）
     */
    async findLeadWithDetails(id: string): Promise<Lead | null> {
        return this.model.findUnique({
            where: { id },
            include: this.detailInclude
        })
    }

    /**
     * 创建线索
     */
    async createLead(data: CreateLeadInput): Promise<Lead> {
        return this.model.create({
            data: {
                ...data,
                serviceTypes: data.serviceTypes || [],
                tags: data.tags || []
            },
            include: this.defaultInclude
        })
    }

    /**
     * 更新线索
     */
    async updateLead(id: string, data: UpdateLeadInput): Promise<Lead> {
        return this.model.update({
            where: { id },
            data,
            include: this.defaultInclude
        })
    }

    /**
     * 分配线索
     */
    async assignLead(id: string, assignedToId: string): Promise<Lead> {
        return this.model.update({
            where: { id },
            data: { assignedToId },
            include: this.defaultInclude
        })
    }

    /**
     * 更新评分
     */
    async updateScore(
        id: string,
        score: number,
        scoreBreakdown: any
    ): Promise<Lead> {
        return this.model.update({
            where: { id },
            data: {
                score,
                scoreBreakdown,
                scoreUpdatedAt: new Date()
            }
        })
    }

    /**
     * 批量更新评分
     */
    async batchUpdateScores(
        updates: Array<{ id: string; score: number; scoreBreakdown: any }>
    ): Promise<number> {
        let updated = 0

        for (const update of updates) {
            await this.updateScore(update.id, update.score, update.scoreBreakdown)
            updated++
        }

        return updated
    }

    /**
     * 按状态统计
     */
    async countByStatus(): Promise<Record<LeadStatus, number>> {
        const result = await this.model.groupBy({
            by: ['status'],
            _count: { status: true }
        })

        const counts: Record<string, number> = {}
        for (const item of result) {
            counts[item.status] = item._count.status
        }

        return counts as Record<LeadStatus, number>
    }

    /**
     * 按来源渠道统计
     */
    async countBySource(): Promise<Record<string, number>> {
        const result = await this.model.groupBy({
            by: ['sourceChannel'],
            _count: { sourceChannel: true }
        })

        const counts: Record<string, number> = {}
        for (const item of result) {
            counts[item.sourceChannel] = item._count.sourceChannel
        }

        return counts
    }

    /**
     * 获取未分配的线索
     */
    async findUnassigned(limit?: number): Promise<Lead[]> {
        return this.model.findMany({
            where: {
                assignedToId: null,
                status: { notIn: ['CONVERTED', 'LOST'] }
            },
            orderBy: { score: 'desc' },
            take: limit,
            include: this.defaultInclude
        })
    }

    /**
     * 获取需要跟进的线索（N天未联系）
     */
    async findNeedingFollowUp(
        assignedToId: string,
        daysSinceContact: number = 7
    ): Promise<Lead[]> {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysSinceContact)

        return this.model.findMany({
            where: {
                assignedToId,
                status: { notIn: ['CONVERTED', 'LOST'] },
                OR: [
                    { lastContactedAt: null },
                    { lastContactedAt: { lt: cutoffDate } }
                ]
            },
            orderBy: { score: 'desc' },
            include: this.defaultInclude
        })
    }

    /**
     * 检查邮箱是否已存在
     */
    async emailExists(email: string, excludeId?: string): Promise<boolean> {
        const where: Prisma.LeadWhereInput = { email }
        if (excludeId) {
            where.id = { not: excludeId }
        }

        const count = await this.model.count({ where })
        return count > 0
    }

    /**
     * 获取高分线索
     */
    async findHighScoreLeads(minScore: number = 50, limit: number = 10): Promise<Lead[]> {
        return this.model.findMany({
            where: {
                score: { gte: minScore },
                status: { notIn: ['CONVERTED', 'LOST'] }
            },
            orderBy: { score: 'desc' },
            take: limit,
            include: this.defaultInclude
        })
    }
}

// 单例导出
export const leadRepository = new LeadRepository()
export default leadRepository
