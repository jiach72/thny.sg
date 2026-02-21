import { BaseRepository, PaginationOptions, PaginatedResult } from './BaseRepository.js'
import type { Task, TaskStatus, TaskPriority, Prisma } from '@prisma/client'

/**
 * Task 过滤条件
 */
export interface TaskFilters {
    status?: TaskStatus
    priority?: TaskPriority
    assignedToId?: string
    projectId?: string
    leadId?: string
    dueBefore?: string
    dueAfter?: string
}

/**
 * Task Repository
 * 封装任务相关的数据库操作
 */
export class TaskRepository extends BaseRepository<Task, Prisma.TaskUncheckedCreateInput, Prisma.TaskUncheckedUpdateInput> {
    protected modelName = 'task'

    /**
     * 默认关联查询
     */
    private defaultInclude = {
        assignedTo: {
            select: { id: true, name: true, avatarUrl: true }
        },
        project: {
            select: { id: true, projectType: true }
        },
        lead: {
            select: { id: true, contactName: true }
        }
    }

    /**
     * 构建过滤条件
     */
    private buildWhereClause(filters: TaskFilters): Prisma.TaskWhereInput {
        const where: Prisma.TaskWhereInput = {}

        if (filters.status) where.status = filters.status
        if (filters.priority) where.priority = filters.priority
        if (filters.assignedToId) where.assignedToId = filters.assignedToId
        if (filters.projectId) where.projectId = filters.projectId
        if (filters.leadId) where.leadId = filters.leadId

        if (filters.dueBefore || filters.dueAfter) {
            const dueDate: Record<string, Date> = {}
            if (filters.dueBefore) dueDate.lte = new Date(filters.dueBefore)
            if (filters.dueAfter) dueDate.gte = new Date(filters.dueAfter)
            where.dueDate = dueDate
        }

        return where
    }

    /**
     * 分页查询任务列表
     */
    async findTasks(
        filters: TaskFilters,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<Task>> {
        const where = this.buildWhereClause(filters)
        return this.findPaginated(where, pagination, this.defaultInclude)
    }

    /**
     * 按状态分组获取任务（看板视图）
     */
    async findGroupedByStatus(assignedToId?: string): Promise<Record<TaskStatus, Task[]>> {
        const where: Prisma.TaskWhereInput = assignedToId
            ? { assignedToId }
            : {}

        const tasks = await this.model.findMany({
            where,
            orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
            include: {
                assignedTo: {
                    select: { id: true, name: true, avatarUrl: true }
                },
                lead: {
                    select: { id: true, contactName: true }
                }
            }
        })

        const grouped: Record<TaskStatus, Task[]> = {
            NOT_STARTED: [],
            IN_PROGRESS: [],
            BLOCKED: [],
            DONE: [],
            CANCELLED: [],
        }

        tasks.forEach((task: Task) => {
            grouped[task.status].push(task)
        })

        return grouped
    }

    /**
     * 获取任务详情
     */
    async findTaskWithDetails(id: string): Promise<Task | null> {
        return this.model.findUnique({
            where: { id },
            include: {
                assignedTo: {
                    select: { id: true, name: true, email: true, avatarUrl: true }
                },
                project: true,
                lead: {
                    select: { id: true, contactName: true, companyName: true }
                }
            }
        })
    }

    /**
     * 统计任务数据
     */
    async getStats(assignedToId?: string) {
        const where: Prisma.TaskWhereInput = assignedToId
            ? { assignedToId }
            : {}

        const [total, byStatus, overdue] = await Promise.all([
            this.model.count({ where }),
            this.model.groupBy({
                by: ['status'],
                where,
                _count: true,
            }),
            this.model.count({
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
            byStatus: byStatus.reduce((acc: Record<string, number>, item: { status: string; _count: number }) => {
                acc[item.status] = item._count
                return acc
            }, {} as Record<string, number>),
        }
    }

    /**
     * 获取逾期任务
     */
    async findOverdueTasks(assignedToId?: string): Promise<Task[]> {
        const where: Prisma.TaskWhereInput = {
            dueDate: { lt: new Date() },
            status: { notIn: ['DONE', 'CANCELLED'] },
        }
        if (assignedToId) where.assignedToId = assignedToId

        return this.model.findMany({
            where,
            orderBy: { dueDate: 'asc' },
            include: this.defaultInclude
        })
    }
}

// 单例导出
export const taskRepository = new TaskRepository()
export default taskRepository
