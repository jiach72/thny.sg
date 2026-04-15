import { prisma } from '../config/index.js'
import { Prisma } from '@prisma/client'
import { NotFoundError } from '../middlewares/index.js'

// ==================== 接口定义 ====================

interface UpsertMinutesInput {
    content: string
    actionItems?: Array<{ task: string; assignee: string; dueDate?: string }>
}

interface MeetingRoomInput {
    name: string
    location?: string
    capacity?: number
    facilities?: string[]
}

// ==================== 会议增强服务 ====================

export const meetingService = {
    // ==================== 会议纪要 ====================

    /**
     * 获取会议纪要
     */
    async getMeetingMinutes(appointmentId: string) {
        const minutes = await prisma.meetingMinutes.findUnique({
            where: { appointmentId },
            include: {
                recordedBy: { select: { id: true, name: true } },
            },
        })

        return minutes // 可能为 null（还没有纪要）
    },

    /**
     * 创建或更新会议纪要
     */
    async upsertMeetingMinutes(appointmentId: string, data: UpsertMinutesInput, recordedById: string) {
        // 验证预约存在
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
        })

        if (!appointment) {
            throw new NotFoundError('预约不存在')
        }

        return prisma.meetingMinutes.upsert({
            where: { appointmentId },
            create: {
                appointmentId,
                content: data.content,
                actionItems: data.actionItems ? JSON.parse(JSON.stringify(data.actionItems)) : undefined,
                recordedById,
            },
            update: {
                content: data.content,
                actionItems: data.actionItems ? JSON.parse(JSON.stringify(data.actionItems)) : undefined,
            },
            include: {
                recordedBy: { select: { id: true, name: true } },
            },
        })
    },

    /**
     * 获取即将到来的会议（未来N天）
     */
    async getUpcomingMeetings(userId: string, days: number = 7) {
        const now = new Date()
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + days)

        return prisma.appointment.findMany({
            where: {
                userId,
                startTime: {
                    gte: now,
                    lte: endDate,
                },
                status: 'SCHEDULED',
            },
            orderBy: { startTime: 'asc' },
            include: {
                customer: { select: { id: true, companyName: true } },
                lead: { select: { id: true, contactName: true } },
                minutes: true,
            },
        })
    },

    // ==================== 会议室管理 ====================

    /**
     * 获取所有会议室
     */
    async getMeetingRooms() {
        return prisma.meetingRoom.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        })
    },

    /**
     * 获取所有会议室（含非活跃，管理页面用）
     */
    async getAllMeetingRooms() {
        return prisma.meetingRoom.findMany({
            orderBy: { createdAt: 'desc' },
        })
    },

    /**
     * 创建会议室
     */
    async createMeetingRoom(data: MeetingRoomInput) {
        return prisma.meetingRoom.create({
            data: {
                name: data.name,
                location: data.location,
                capacity: data.capacity || 6,
                facilities: data.facilities || [],
            },
        })
    },

    /**
     * 更新会议室
     */
    async updateMeetingRoom(id: string, data: Partial<MeetingRoomInput> & { status?: string; isActive?: boolean }) {
        const room = await prisma.meetingRoom.findUnique({ where: { id } })
        if (!room) throw new NotFoundError('会议室不存在')

        const updateData: Prisma.MeetingRoomUpdateInput = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.location !== undefined) updateData.location = data.location
        if (data.capacity !== undefined) updateData.capacity = data.capacity
        if (data.facilities !== undefined) updateData.facilities = data.facilities
        if (data.status !== undefined) updateData.status = data.status as Prisma.EnumMeetingRoomStatusFieldUpdateOperationsInput
        if (data.isActive !== undefined) updateData.isActive = data.isActive

        return prisma.meetingRoom.update({
            where: { id },
            data: updateData,
        })
    },

    /**
     * 删除会议室（标记为非活跃）
     */
    async deleteMeetingRoom(id: string) {
        const room = await prisma.meetingRoom.findUnique({ where: { id } })
        if (!room) throw new NotFoundError('会议室不存在')

        return prisma.meetingRoom.update({
            where: { id },
            data: { isActive: false },
        })
    },

    // ==================== 报销分类配置 ====================

    /**
     * 获取所有报销分类配置
     */
    async getExpenseCategoryConfigs(activeOnly: boolean = true) {
        return prisma.expenseCategoryConfig.findMany({
            where: activeOnly ? { isActive: true } : {},
            orderBy: { sortOrder: 'asc' },
        })
    },

    /**
     * 创建报销分类
     */
    async createExpenseCategoryConfig(data: {
        code: string
        name: string
        nameEn?: string
        icon?: string
        maxAmount?: number
        requireReceipt?: boolean
        sortOrder?: number
    }) {
        return prisma.expenseCategoryConfig.create({
            data: {
                code: data.code,
                name: data.name,
                nameEn: data.nameEn,
                icon: data.icon,
                maxAmount: data.maxAmount,
                requireReceipt: data.requireReceipt ?? true,
                sortOrder: data.sortOrder || 0,
            },
        })
    },

    /**
     * 更新报销分类
     */
    async updateExpenseCategoryConfig(id: string, data: Partial<{
        code: string
        name: string
        nameEn: string
        icon: string
        maxAmount: number
        requireReceipt: boolean
        isActive: boolean
        sortOrder: number
    }>) {
        const config = await prisma.expenseCategoryConfig.findUnique({ where: { id } })
        if (!config) throw new NotFoundError('分类配置不存在')

        return prisma.expenseCategoryConfig.update({
            where: { id },
            data,
        })
    },

    /**
     * 删除报销分类（软删除：设为非活跃）
     */
    async deleteExpenseCategoryConfig(id: string) {
        const config = await prisma.expenseCategoryConfig.findUnique({ where: { id } })
        if (!config) throw new NotFoundError('分类配置不存在')

        return prisma.expenseCategoryConfig.update({
            where: { id },
            data: { isActive: false },
        })
    },
}
