import { prisma } from '../config/index.js'
import { NotFoundError, ConflictError, BusinessLogicError } from '../middlewares/index.js'
import type { Prisma, AppointmentType, AppointmentStatus } from '@prisma/client'

interface CreateAppointmentInput {
    title: string
    description?: string
    startTime: string
    endTime: string
    type?: AppointmentType
    status?: AppointmentStatus
    location?: string
    meetingLink?: string
    userId: string
    customerId?: string
    leadId?: string
}

interface UpdateAppointmentInput {
    title?: string
    description?: string
    startTime?: string
    endTime?: string
    type?: AppointmentType
    status?: AppointmentStatus
    location?: string
    meetingLink?: string
    userId?: string
    customerId?: string
}

interface AppointmentFilters {
    userId?: string
    customerId?: string
    leadId?: string
    status?: AppointmentStatus
    startDate?: string
    endDate?: string
}

interface PaginationOptions {
    page: number
    limit: number
}

export const appointmentService = {
    /**
     * 获取预约列表
     */
    async getAppointments(filters: AppointmentFilters, pagination: PaginationOptions) {
        const { page, limit } = pagination
        const skip = (page - 1) * limit

        const where: Prisma.AppointmentWhereInput = {}

        if (filters.userId) where.userId = filters.userId
        if (filters.customerId) where.customerId = filters.customerId
        if (filters.leadId) where.leadId = filters.leadId
        if (filters.status) where.status = filters.status

        if (filters.startDate || filters.endDate) {
            where.startTime = {}
            if (filters.startDate) where.startTime.gte = new Date(filters.startDate)
            if (filters.endDate) where.startTime.lte = new Date(filters.endDate)
        }

        const [appointments, total] = await Promise.all([
            prisma.appointment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { startTime: 'asc' },
                include: {
                    user: { select: { id: true, name: true, avatarUrl: true } },
                    customer: { select: { id: true, contactName: true, companyName: true } },
                    lead: { select: { id: true, contactName: true, companyName: true } },
                }
            }),
            prisma.appointment.count({ where })
        ])

        return {
            data: appointments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    },

    /**
     * 获取单个预约
     */
    async getAppointmentById(id: string) {
        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
                customer: { select: { id: true, contactName: true, companyName: true } },
                lead: { select: { id: true, contactName: true, companyName: true } },
            }
        })

        if (!appointment) throw new NotFoundError('预约不存在')
        return appointment
    },

    /**
     * 检查预约时间冲突
     */
    async checkConflict(
        userId: string,
        startTime: Date,
        endTime: Date,
        excludeId?: string,
        customerId?: string
    ) {
        const conditions: Prisma.AppointmentWhereInput[] = [
            { userId }
        ]
        if (customerId) conditions.push({ customerId })

        const overlapping = await prisma.appointment.findFirst({
            where: {
                OR: conditions,
                id: excludeId ? { not: excludeId } : undefined,
                status: 'SCHEDULED', // 仅检测正常计划中的冲突
                startTime: { lt: endTime },
                endTime: { gt: startTime }
            }
        })

        if (overlapping) {
            throw new ConflictError(
                `预约时间冲突：在此时段已存在相关的已排期预约 (${overlapping.title})`
            )
        }
    },

    /**
     * 创建预约
     */
    async createAppointment(data: CreateAppointmentInput) {
        const startTime = new Date(data.startTime)
        const endTime = new Date(data.endTime)

        if (startTime >= endTime) {
            throw new BusinessLogicError('开始时间必须早于结束时间')
        }

        // 冲突检测
        await this.checkConflict(data.userId, startTime, endTime, undefined, data.customerId)

        return await prisma.appointment.create({
            data: {
                title: data.title,
                description: data.description,
                startTime,
                endTime,
                type: data.type,
                status: data.status,
                location: data.location,
                meetingLink: data.meetingLink,
                userId: data.userId,
                customerId: data.customerId,
                leadId: data.leadId,
            }
        })
    },

    /**
     * 更新预约
     */
    async updateAppointment(id: string, data: UpdateAppointmentInput) {
        const existing = await prisma.appointment.findUnique({ where: { id } })
        if (!existing) throw new NotFoundError('预约不存在')

        let startTime = existing.startTime
        let endTime = existing.endTime

        if (data.startTime) startTime = new Date(data.startTime)
        if (data.endTime) endTime = new Date(data.endTime)

        if (startTime >= endTime) {
            throw new BusinessLogicError('开始时间必须早于结束时间')
        }

        // 若时间、状态或参与人有变，或者依然是 scheduled，进行冲突检测
        const status = data.status || existing.status
        if (status === 'SCHEDULED' && (
            data.startTime || data.endTime || data.userId || data.customerId
        )) {
            const userId = data.userId || existing.userId
            const customerId = data.customerId !== undefined ? data.customerId : existing.customerId

            await this.checkConflict(userId, startTime, endTime, id, customerId || undefined)
        }

        return await prisma.appointment.update({
            where: { id },
            data: {
                ...data,
                startTime,
                endTime,
            }
        })
    },

    /**
     * 删除预约
     */
    async deleteAppointment(id: string) {
        const existing = await prisma.appointment.findUnique({ where: { id } })
        if (!existing) throw new NotFoundError('预约不存在')

        await prisma.appointment.delete({ where: { id } })
        return { success: true }
    }
}
