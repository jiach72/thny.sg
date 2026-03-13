import { prisma } from '../config/index.js'
import { NotFoundError, ConflictError, ForbiddenError } from '../middlewares/index.js'
import type { Prisma, ClaimStatus } from '@prisma/client'

// ==================== 接口定义 ====================

interface CreateClaimInput {
    title: string
    description?: string
    currency?: string
    projectId?: string
}

interface AddClaimItemInput {
    category?: string
    description: string
    amount: number
    expenseDate: string
    notes?: string
}

interface ClaimFilters {
    submitterId?: string
    status?: ClaimStatus
    startDate?: string
    endDate?: string
    projectId?: string
}

interface PaginationOptions {
    page: number
    limit: number
}

// 审批状态机：只允许合法的状态转换
const VALID_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ['SUBMITTED'],
    SUBMITTED: ['MANAGER_APPROVED', 'REJECTED'],
    MANAGER_APPROVED: ['APPROVED', 'REJECTED'],
    APPROVED: ['PAID'],
    REJECTED: ['DRAFT'], // 驳回后可重新编辑
    PAID: [],
}

// ==================== 报销服务 ====================

export const claimService = {
    /**
     * 生成报销单号 CLM-YYYYMMDD-NNN
     */
    async generateClaimNumber(): Promise<string> {
        const today = new Date()
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
        const prefix = `CLM-${dateStr}-`

        // 查找今天已有的最大序号
        const lastClaim = await prisma.claim.findFirst({
            where: {
                claimNumber: { startsWith: prefix },
            },
            orderBy: { claimNumber: 'desc' },
            select: { claimNumber: true },
        })

        let seq = 1
        if (lastClaim) {
            const lastSeq = parseInt(lastClaim.claimNumber.split('-').pop() || '0', 10)
            seq = lastSeq + 1
        }

        return `${prefix}${String(seq).padStart(3, '0')}`
    },

    /**
     * 创建报销单（草稿状态）
     */
    async createClaim(data: CreateClaimInput, submitterId: string) {
        const claimNumber = await claimService.generateClaimNumber()

        return prisma.claim.create({
            data: {
                claimNumber,
                title: data.title,
                description: data.description,
                currency: data.currency || 'SGD',
                projectId: data.projectId,
                submitterId,
                totalAmount: 0, // 初始为0，添加明细时自动计算
                status: 'DRAFT',
            },
            include: { items: true },
        })
    },

    /**
     * 添加报销明细
     */
    async addClaimItem(claimId: string, data: AddClaimItemInput, submitterId: string) {
        const claim = await prisma.claim.findFirst({
            where: { id: claimId, deletedAt: null },
        })

        if (!claim) throw new NotFoundError('报销单不存在')
        if (claim.submitterId !== submitterId) throw new ForbiddenError('只能编辑自己的报销单')
        if (claim.status !== 'DRAFT') throw new ConflictError('只有草稿状态的报销单可以添加明细')

        const item = await prisma.claimItem.create({
            data: {
                claimId,
                category: (data.category as any) || 'OTHER',
                description: data.description,
                amount: data.amount,
                expenseDate: new Date(data.expenseDate),
                notes: data.notes,
            },
        })

        // 重新计算总金额
        await claimService.recalculateTotal(claimId)

        return item
    },

    /**
     * 删除报销明细
     */
    async removeClaimItem(claimId: string, itemId: string, submitterId: string) {
        const claim = await prisma.claim.findFirst({
            where: { id: claimId, deletedAt: null },
        })

        if (!claim) throw new NotFoundError('报销单不存在')
        if (claim.submitterId !== submitterId) throw new ForbiddenError('只能编辑自己的报销单')
        if (claim.status !== 'DRAFT') throw new ConflictError('只有草稿状态可以删除明细')

        await prisma.claimItem.delete({
            where: { id: itemId, claimId },
        })

        // 重新计算总金额
        await claimService.recalculateTotal(claimId)
    },

    /**
     * 重新计算报销单总金额
     */
    async recalculateTotal(claimId: string) {
        const result = await prisma.claimItem.aggregate({
            where: { claimId },
            _sum: { amount: true },
        })

        await prisma.claim.update({
            where: { id: claimId },
            data: { totalAmount: result._sum.amount || 0 },
        })
    },

    /**
     * 提交审批（DRAFT → SUBMITTED）
     */
    async submitClaim(claimId: string, submitterId: string) {
        const claim = await prisma.claim.findFirst({
            where: { id: claimId, deletedAt: null },
            include: { items: true },
        })

        if (!claim) throw new NotFoundError('报销单不存在')
        if (claim.submitterId !== submitterId) throw new ForbiddenError('只能提交自己的报销单')
        if (claim.status !== 'DRAFT') throw new ConflictError('只有草稿状态可以提交')
        if (claim.items.length === 0) throw new ConflictError('报销单至少需要一项明细')

        return prisma.claim.update({
            where: { id: claimId },
            data: { status: 'SUBMITTED' },
            include: { items: true },
        })
    },

    /**
     * 审批通过（自动判断层级）
     * Manager: SUBMITTED → MANAGER_APPROVED
     * Admin: SUBMITTED/MANAGER_APPROVED → APPROVED
     */
    async approveClaim(claimId: string, approverId: string, comment: string | undefined, isAdmin: boolean) {
        const claim = await prisma.claim.findFirst({
            where: { id: claimId, deletedAt: null },
        })

        if (!claim) throw new NotFoundError('报销单不存在')

        // 验证状态转换合法性
        if (isAdmin) {
            // Admin 可以从 SUBMITTED 或 MANAGER_APPROVED 直接批准
            if (claim.status !== 'SUBMITTED' && claim.status !== 'MANAGER_APPROVED') {
                throw new ConflictError('当前状态不允许审批')
            }

            return prisma.claim.update({
                where: { id: claimId },
                data: {
                    status: 'APPROVED',
                    adminApprovedById: approverId,
                    adminApprovedAt: new Date(),
                    adminComment: comment,
                    // 如果是直接从 SUBMITTED 审批，同时记录
                    ...(claim.status === 'SUBMITTED' ? {
                        managerApprovedById: approverId,
                        managerApprovedAt: new Date(),
                        managerComment: 'Admin 直接审批',
                    } : {}),
                },
                include: { items: true },
            })
        } else {
            // Manager 只能从 SUBMITTED → MANAGER_APPROVED
            if (claim.status !== 'SUBMITTED') {
                throw new ConflictError('当前状态不允许经理审批')
            }

            return prisma.claim.update({
                where: { id: claimId },
                data: {
                    status: 'MANAGER_APPROVED',
                    managerApprovedById: approverId,
                    managerApprovedAt: new Date(),
                    managerComment: comment,
                },
                include: { items: true },
            })
        }
    },

    /**
     * 驳回报销单
     */
    async rejectClaim(claimId: string, approverId: string, reason: string) {
        const claim = await prisma.claim.findFirst({
            where: { id: claimId, deletedAt: null },
        })

        if (!claim) throw new NotFoundError('报销单不存在')
        if (claim.status !== 'SUBMITTED' && claim.status !== 'MANAGER_APPROVED') {
            throw new ConflictError('当前状态不允许驳回')
        }

        return prisma.claim.update({
            where: { id: claimId },
            data: {
                status: 'REJECTED',
                rejectedById: approverId,
                rejectedAt: new Date(),
                rejectionReason: reason,
            },
            include: { items: true },
        })
    },

    /**
     * 标记已付款（仅 Admin）
     */
    async markAsPaid(claimId: string, paymentRef: string) {
        const claim = await prisma.claim.findFirst({
            where: { id: claimId, deletedAt: null },
        })

        if (!claim) throw new NotFoundError('报销单不存在')
        if (claim.status !== 'APPROVED') {
            throw new ConflictError('只有已批准的报销单可以标记付款')
        }

        return prisma.claim.update({
            where: { id: claimId },
            data: {
                status: 'PAID',
                paidAt: new Date(),
                paymentRef,
            },
            include: { items: true },
        })
    },

    /**
     * 获取报销列表（RBAC: 普通员工只看自己的）
     */
    async getClaimList(filters: ClaimFilters, pagination: PaginationOptions) {
        const { page, limit } = pagination
        const skip = (page - 1) * limit

        const where: Prisma.ClaimWhereInput = {
            deletedAt: null,
        }

        if (filters.submitterId) where.submitterId = filters.submitterId
        if (filters.status) where.status = filters.status
        if (filters.projectId) where.projectId = filters.projectId

        if (filters.startDate || filters.endDate) {
            where.createdAt = {}
            if (filters.startDate) where.createdAt.gte = new Date(filters.startDate)
            if (filters.endDate) where.createdAt.lte = new Date(filters.endDate)
        }

        const [claims, total] = await Promise.all([
            prisma.claim.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        select: {
                            id: true,
                            category: true,
                            amount: true,
                            receiptUrl: true,
                        },
                    },
                    submitter: {
                        select: { id: true, name: true, email: true },
                    },
                },
            }),
            prisma.claim.count({ where }),
        ])

        return {
            data: claims,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    },

    /**
     * 获取报销详情
     */
    async getClaimById(claimId: string) {
        const claim = await prisma.claim.findFirst({
            where: { id: claimId, deletedAt: null },
            include: {
                items: true,
                submitter: { select: { id: true, name: true, email: true } },
                managerApprovedBy: { select: { id: true, name: true } },
                adminApprovedBy: { select: { id: true, name: true } },
                rejectedBy: { select: { id: true, name: true } },
            },
        })

        if (!claim) throw new NotFoundError('报销单不存在')
        return claim
    },

    /**
     * 获取报销统计
     */
    async getClaimStats(submitterId?: string) {
        const baseWhere: Prisma.ClaimWhereInput = { deletedAt: null }
        if (submitterId) baseWhere.submitterId = submitterId

        const [total, pending, approved, paid, totalAmount] = await Promise.all([
            prisma.claim.count({ where: baseWhere }),
            prisma.claim.count({ where: { ...baseWhere, status: { in: ['SUBMITTED', 'MANAGER_APPROVED'] } } }),
            prisma.claim.count({ where: { ...baseWhere, status: 'APPROVED' } }),
            prisma.claim.count({ where: { ...baseWhere, status: 'PAID' } }),
            prisma.claim.aggregate({
                where: { ...baseWhere, status: { in: ['APPROVED', 'PAID'] } },
                _sum: { totalAmount: true },
            }),
        ])

        return {
            total,
            pending,
            approved,
            paid,
            totalApprovedAmount: totalAmount._sum.totalAmount || 0,
        }
    },

    /**
     * 上传收据（更新明细的收据字段）
     */
    async uploadReceipt(claimItemId: string, receiptUrl: string, receiptName: string) {
        const item = await prisma.claimItem.findUnique({
            where: { id: claimItemId },
        })

        if (!item) throw new NotFoundError('报销明细不存在')

        return prisma.claimItem.update({
            where: { id: claimItemId },
            data: { receiptUrl, receiptName },
        })
    },

    /**
     * 重新编辑被驳回的报销单（REJECTED → DRAFT）
     */
    async resubmitClaim(claimId: string, submitterId: string) {
        const claim = await prisma.claim.findFirst({
            where: { id: claimId, deletedAt: null },
        })

        if (!claim) throw new NotFoundError('报销单不存在')
        if (claim.submitterId !== submitterId) throw new ForbiddenError('只能编辑自己的报销单')
        if (claim.status !== 'REJECTED') throw new ConflictError('只有被驳回的报销单可以重新编辑')

        return prisma.claim.update({
            where: { id: claimId },
            data: {
                status: 'DRAFT',
                // 清空之前的审批/驳回记录
                rejectedById: null,
                rejectedAt: null,
                rejectionReason: null,
                managerApprovedById: null,
                managerApprovedAt: null,
                managerComment: null,
                adminApprovedById: null,
                adminApprovedAt: null,
                adminComment: null,
            },
            include: { items: true },
        })
    },
}
