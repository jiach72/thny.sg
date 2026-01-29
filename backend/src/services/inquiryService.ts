import { prisma } from '../config/index.js'
import { NotFoundError } from '../middlewares/index.js'
import type { Prisma, InquiryStatus } from '@prisma/client'

interface CreateInquiryInput {
    name: string
    email?: string
    phone?: string
    message: string
    source?: string
    ipAddress?: string
}

interface UpdateInquiryInput {
    status?: InquiryStatus
    processedLeadId?: string
}

interface PaginationOptions {
    page: number
    limit: number
}

export const inquiryService = {
    /**
     * 获取咨询列表
     */
    async getInquiries(status: InquiryStatus | undefined, pagination: PaginationOptions) {
        const { page, limit } = pagination
        const skip = (page - 1) * limit

        const where: Prisma.InquiryWhereInput = status ? { status } : {}

        const [inquiries, total] = await Promise.all([
            prisma.inquiry.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    processedLead: { select: { id: true, contactName: true } }
                }
            }),
            prisma.inquiry.count({ where })
        ])

        return {
            data: inquiries,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    },

    /**
     * 创建咨询 (通常来自官网表单)
     */
    async createInquiry(data: CreateInquiryInput) {
        return await prisma.inquiry.create({
            data
        })
    },

    /**
     * 更新咨询状态
     */
    async updateInquiry(id: string, data: UpdateInquiryInput) {
        const existing = await prisma.inquiry.findUnique({ where: { id } })
        if (!existing) throw new NotFoundError('咨询不存在')

        return await prisma.inquiry.update({
            where: { id },
            data
        })
    },

    /**
     * 删除咨询
     */
    async deleteInquiry(id: string) {
        const existing = await prisma.inquiry.findUnique({ where: { id } })
        if (!existing) throw new NotFoundError('咨询不存在')

        await prisma.inquiry.delete({ where: { id } })
        return { success: true }
    }
}
