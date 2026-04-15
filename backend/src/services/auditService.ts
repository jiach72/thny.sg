import { prisma } from '../config/index.js'
import { Prisma } from '@prisma/client'
import logger from '../config/logger.js'

interface AuditLogInput {
    userId: string
    action: string
    resource: string
    resourceId?: string
    ipAddress?: string
    userAgent?: string
    details?: Record<string, unknown>
}

interface AuditQueryParams {
    page?: number
    limit?: number
    userId?: string
    action?: string
    resource?: string
    startDate?: string
    endDate?: string
}

export const auditService = {
    /**
     * 记录审计事件
     */
    async logAction(input: AuditLogInput) {
        try {
            await prisma.auditLog.create({
                data: {
                    userId: input.userId,
                    action: input.action,
                    resource: input.resource,
                    resourceId: input.resourceId,
                    ipAddress: input.ipAddress,
                    userAgent: input.userAgent,
                    details: input.details ? (input.details as Prisma.InputJsonValue) : undefined,
                },
            })
        } catch (error) {
            // 审计日志写入失败不应阻塞业务
            logger.error('审计日志写入失败', {
                error: error instanceof Error ? error.message : '未知错误',
                input,
                context: 'auditService',
            })
        }
    },

    /**
     * 查询审计日志（分页 + 筛选）
     */
    async getAuditLogs(params: AuditQueryParams) {
        const page = params.page || 1
        const limit = Math.min(params.limit || 20, 100)
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}

        if (params.userId) where.userId = params.userId
        if (params.action) where.action = params.action
        if (params.resource) where.resource = params.resource

        if (params.startDate || params.endDate) {
            const createdAt: Record<string, Date> = {}
            if (params.startDate) createdAt.gte = new Date(params.startDate)
            if (params.endDate) createdAt.lte = new Date(params.endDate)
            where.createdAt = createdAt
        }

        const [total, data] = await Promise.all([
            prisma.auditLog.count({ where }),
            prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
        ])

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    },
}
