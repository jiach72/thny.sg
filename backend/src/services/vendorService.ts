import { prisma } from '../config/index.js'
import { NotFoundError } from '../middlewares/index.js'
import type { Prisma, VendorType, VendorStatus } from '@prisma/client'

// ==================== 接口定义 ====================

interface CreateVendorInput {
    name: string
    type?: VendorType
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    website?: string
    address?: string
    registrationNo?: string
    taxId?: string
    serviceScope?: string[]
    contractStart?: string
    contractEnd?: string
    contractTerms?: string
    notes?: string
}

interface UpdateVendorInput extends Partial<CreateVendorInput> {
    status?: VendorStatus
    rating?: number
}

interface VendorFilters {
    type?: VendorType
    status?: VendorStatus
    search?: string
}

interface PaginationOptions {
    page: number
    limit: number
}

interface AssignToProjectInput {
    projectId: string
    role: string
    fee?: number
    currency?: string
    notes?: string
}

// ==================== 供应商服务 ====================

export const vendorService = {
    /**
     * 获取供应商列表（分页 + 搜索）
     */
    async getVendorList(filters: VendorFilters, pagination: PaginationOptions) {
        const { page, limit } = pagination
        const skip = (page - 1) * limit

        const where: Prisma.VendorWhereInput = {
            deletedAt: null, // 软删除过滤
        }

        if (filters.type) where.type = filters.type
        if (filters.status) where.status = filters.status
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { contactName: { contains: filters.search, mode: 'insensitive' } },
                { contactEmail: { contains: filters.search, mode: 'insensitive' } },
            ]
        }

        const [vendors, total] = await Promise.all([
            prisma.vendor.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    assignments: {
                        select: {
                            id: true,
                            projectId: true,
                            role: true,
                            status: true,
                        },
                    },
                },
            }),
            prisma.vendor.count({ where }),
        ])

        return {
            data: vendors,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    },

    /**
     * 获取供应商详情（含所有分配记录）
     */
    async getVendorById(id: string) {
        const vendor = await prisma.vendor.findFirst({
            where: { id, deletedAt: null },
            include: {
                assignments: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        })

        if (!vendor) {
            throw new NotFoundError('供应商不存在')
        }

        return vendor
    },

    /**
     * 获取供应商统计
     */
    async getVendorStats() {
        const [total, active, inactive, byType] = await Promise.all([
            prisma.vendor.count({ where: { deletedAt: null } }),
            prisma.vendor.count({ where: { status: 'ACTIVE', deletedAt: null } }),
            prisma.vendor.count({ where: { status: 'INACTIVE', deletedAt: null } }),
            prisma.vendor.groupBy({
                by: ['type'],
                where: { deletedAt: null },
                _count: { id: true },
            }),
        ])

        // 合同即将到期（30天内）
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        const expiringContracts = await prisma.vendor.count({
            where: {
                deletedAt: null,
                status: 'ACTIVE',
                contractEnd: {
                    lte: thirtyDaysFromNow,
                    gte: new Date(),
                },
            },
        })

        return {
            total,
            active,
            inactive,
            expiringContracts,
            byType: byType.map((item) => ({
                type: item.type,
                count: item._count.id,
            })),
        }
    },

    /**
     * 创建供应商
     */
    async createVendor(data: CreateVendorInput) {
        return prisma.vendor.create({
            data: {
                name: data.name,
                type: data.type || 'OTHER',
                contactName: data.contactName,
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone,
                website: data.website,
                address: data.address,
                registrationNo: data.registrationNo,
                taxId: data.taxId,
                serviceScope: data.serviceScope || [],
                contractStart: data.contractStart ? new Date(data.contractStart) : undefined,
                contractEnd: data.contractEnd ? new Date(data.contractEnd) : undefined,
                contractTerms: data.contractTerms,
                notes: data.notes,
            },
        })
    },

    /**
     * 更新供应商
     */
    async updateVendor(id: string, data: UpdateVendorInput) {
        // 先验证存在
        await vendorService.getVendorById(id)

        const updateData: Prisma.VendorUpdateInput = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.type !== undefined) updateData.type = data.type
        if (data.status !== undefined) updateData.status = data.status
        if (data.contactName !== undefined) updateData.contactName = data.contactName
        if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail
        if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone
        if (data.website !== undefined) updateData.website = data.website
        if (data.address !== undefined) updateData.address = data.address
        if (data.registrationNo !== undefined) updateData.registrationNo = data.registrationNo
        if (data.taxId !== undefined) updateData.taxId = data.taxId
        if (data.serviceScope !== undefined) updateData.serviceScope = data.serviceScope
        if (data.rating !== undefined) updateData.rating = data.rating
        if (data.contractStart !== undefined) updateData.contractStart = new Date(data.contractStart)
        if (data.contractEnd !== undefined) updateData.contractEnd = new Date(data.contractEnd)
        if (data.contractTerms !== undefined) updateData.contractTerms = data.contractTerms
        if (data.notes !== undefined) updateData.notes = data.notes

        return prisma.vendor.update({
            where: { id },
            data: updateData,
            include: { assignments: true },
        })
    },

    /**
     * 软删除供应商
     */
    async deleteVendor(id: string) {
        await vendorService.getVendorById(id)

        return prisma.vendor.update({
            where: { id },
            data: { deletedAt: new Date() },
        })
    },

    /**
     * 分配供应商到项目
     */
    async assignToProject(vendorId: string, data: AssignToProjectInput) {
        // 验证供应商存在
        await vendorService.getVendorById(vendorId)

        return prisma.vendorAssignment.create({
            data: {
                vendorId,
                projectId: data.projectId,
                role: data.role,
                fee: data.fee,
                currency: data.currency || 'SGD',
                notes: data.notes,
            },
        })
    },

    /**
     * 更新分配
     */
    async updateAssignment(assignmentId: string, data: Partial<AssignToProjectInput> & { status?: string }) {
        const assignment = await prisma.vendorAssignment.findUnique({
            where: { id: assignmentId },
        })

        if (!assignment) {
            throw new NotFoundError('分配记录不存在')
        }

        const updateData: Prisma.VendorAssignmentUpdateInput = {}
        if (data.role !== undefined) updateData.role = data.role
        if (data.status !== undefined) updateData.status = data.status
        if (data.fee !== undefined) updateData.fee = data.fee
        if (data.currency !== undefined) updateData.currency = data.currency
        if (data.notes !== undefined) updateData.notes = data.notes

        return prisma.vendorAssignment.update({
            where: { id: assignmentId },
            data: updateData,
        })
    },

    /**
     * 移除分配
     */
    async removeAssignment(assignmentId: string) {
        const assignment = await prisma.vendorAssignment.findUnique({
            where: { id: assignmentId },
        })

        if (!assignment) {
            throw new NotFoundError('分配记录不存在')
        }

        return prisma.vendorAssignment.delete({
            where: { id: assignmentId },
        })
    },

    /**
     * 按项目查供应商
     */
    async getVendorsByProject(projectId: string) {
        return prisma.vendorAssignment.findMany({
            where: { projectId },
            include: {
                vendor: true,
            },
            orderBy: { createdAt: 'desc' },
        })
    },
}
