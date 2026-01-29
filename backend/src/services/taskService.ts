import { prisma } from '../config/index.js'
import { NotFoundError } from '../middlewares/index.js'
import type { TaskStatus, TaskPriority, Prisma } from '@prisma/client'

interface CreateTaskInput {
    title: string
    description?: string
    projectId?: string
    leadId?: string
    assignedToId?: string
    priority?: TaskPriority
    dueDate?: string
    slaHours?: number
    tags?: string[]
}

interface UpdateTaskInput {
    title?: string
    description?: string
    assignedToId?: string
    status?: TaskStatus
    priority?: TaskPriority
    dueDate?: string
    blockingReason?: string
    tags?: string[]
    timeSpentHours?: number
    notes?: string
    completedAt?: string
}

interface TaskFilters {
    status?: TaskStatus
    priority?: TaskPriority
    assignedToId?: string
    projectId?: string
    leadId?: string
    dueBefore?: string
    dueAfter?: string
}

interface PaginationOptions {
    page: number
    limit: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export const taskService = {
    /**
     * 获取任务列表 (分页)
     */
    async getTasks(filters: TaskFilters, pagination: PaginationOptions) {
        const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination
        const skip = (page - 1) * limit

        const where: Prisma.TaskWhereInput = {}

        if (filters.status) {
            where.status = filters.status
        }
        if (filters.priority) {
            where.priority = filters.priority
        }
        if (filters.assignedToId) {
            where.assignedToId = filters.assignedToId
        }
        if (filters.projectId) {
            where.projectId = filters.projectId
        }
        if (filters.leadId) {
            where.leadId = filters.leadId
        }
        if (filters.dueBefore) {
            where.dueDate = { ...(where.dueDate as object), lte: new Date(filters.dueBefore) }
        }
        if (filters.dueAfter) {
            where.dueDate = { ...(where.dueDate as object), gte: new Date(filters.dueAfter) }
        }

        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    assignedTo: {
                        select: { id: true, name: true, avatarUrl: true },
                    },
                    project: {
                        select: { id: true, projectType: true },
                    },
                    lead: {
                        select: { id: true, contactName: true },
                    },
                },
            }),
            prisma.task.count({ where }),
        ])

        return {
            data: tasks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }
    },

    /**
     * 根据状态获取任务 (看板视图)
     */
    async getTasksByStatus(assignedToId?: string) {
        const where: Prisma.TaskWhereInput = assignedToId
            ? { assignedToId }
            : {}

        const tasks = await prisma.task.findMany({
            where,
            orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
            include: {
                assignedTo: {
                    select: { id: true, name: true, avatarUrl: true },
                },
                lead: {
                    select: { id: true, contactName: true },
                },
            },
        })

        // 按状态分组
        const grouped: Record<TaskStatus, typeof tasks> = {
            NOT_STARTED: [],
            IN_PROGRESS: [],
            BLOCKED: [],
            DONE: [],
            CANCELLED: [],
        }

        tasks.forEach(task => {
            grouped[task.status].push(task)
        })

        return grouped
    },

    /**
     * 获取单个任务
     */
    async getTaskById(id: string) {
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                assignedTo: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                },
                project: true,
                lead: {
                    select: { id: true, contactName: true, companyName: true },
                },
            },
        })

        if (!task) {
            throw new NotFoundError('任务不存在')
        }

        return task
    },

    /**
     * 创建任务
     */
    async createTask(data: CreateTaskInput) {
        const task = await prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                projectId: data.projectId,
                leadId: data.leadId,
                assignedToId: data.assignedToId,
                priority: data.priority || 'MEDIUM',
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                slaHours: data.slaHours,
                tags: data.tags || [],
                status: 'NOT_STARTED',
            },
            include: {
                assignedTo: {
                    select: { id: true, name: true },
                },
            },
        })

        return task
    },

    /**
     * 更新任务
     */
    async updateTask(id: string, data: UpdateTaskInput) {
        const existing = await prisma.task.findUnique({ where: { id } })
        if (!existing) {
            throw new NotFoundError('任务不存在')
        }

        // 如果状态变为 DONE，自动设置 completedAt
        let completedAt = data.completedAt ? new Date(data.completedAt) : undefined
        if (data.status === 'DONE' && !existing.completedAt) {
            completedAt = new Date()
        }

        const task = await prisma.task.update({
            where: { id },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
                ...(data.status && { status: data.status }),
                ...(data.priority && { priority: data.priority }),
                ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
                ...(data.blockingReason !== undefined && { blockingReason: data.blockingReason }),
                ...(data.tags && { tags: data.tags }),
                ...(data.timeSpentHours !== undefined && { timeSpentHours: data.timeSpentHours }),
                ...(data.notes !== undefined && { notes: data.notes }),
                ...(completedAt && { completedAt }),
            },
            include: {
                assignedTo: {
                    select: { id: true, name: true },
                },
            },
        })

        return task
    },

    /**
     * 删除任务
     */
    async deleteTask(id: string) {
        const task = await prisma.task.findUnique({ where: { id } })
        if (!task) {
            throw new NotFoundError('任务不存在')
        }

        await prisma.task.delete({ where: { id } })
        return { success: true }
    },

    /**
     * 获取任务统计
     */
    async getTaskStats(assignedToId?: string) {
        const where: Prisma.TaskWhereInput = assignedToId
            ? { assignedToId }
            : {}

        const [total, byStatus, overdue] = await Promise.all([
            prisma.task.count({ where }),
            prisma.task.groupBy({
                by: ['status'],
                where,
                _count: true,
            }),
            prisma.task.count({
                where: {
                    ...where,
                    dueDate: { lt: new Date() },
                    status: { notIn: ['DONE', 'CANCELLED'] },
                },
            }),
        ])

        return {
            total,
            overdue,
            byStatus: byStatus.reduce((acc, item) => {
                acc[item.status] = item._count
                return acc
            }, {} as Record<string, number>),
        }
    },
}

export default taskService
