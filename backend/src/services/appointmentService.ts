import { prisma } from '../config/index.js'
import { NotFoundError } from '../middlewares/index.js'
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
     * 创建预约
     */
    async createAppointment(data: CreateAppointmentInput) {
        return await prisma.appointment.create({
            data: {
                title: data.title,
                description: data.description,
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
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

        return await prisma.appointment.update({
            where: { id },
            data: {
                ...data,
                startTime: data.startTime ? new Date(data.startTime) : undefined,
                endTime: data.endTime ? new Date(data.endTime) : undefined,
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
