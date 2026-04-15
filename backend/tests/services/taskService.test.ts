import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    task: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
    },
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { taskService } from '../../src/services/taskService.js'

describe('TaskService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getTasks', () => {
        it('应返回分页任务列表', async () => {
            const mockTasks = [{ id: '1', title: 'Task 1' }]
            prismaMock.task.findMany.mockResolvedValue(mockTasks)
            prismaMock.task.count.mockResolvedValue(1)

            const result = await taskService.getTasks({}, { page: 1, limit: 10 })
            expect(result.data).toEqual(mockTasks)
            expect(result.pagination.total).toBe(1)
        })

        it('应支持筛选条件', async () => {
            prismaMock.task.findMany.mockResolvedValue([])
            prismaMock.task.count.mockResolvedValue(0)

            await taskService.getTasks(
                { status: 'IN_PROGRESS', priority: 'HIGH', assignedToId: 'u1', projectId: 'p1', leadId: 'l1', dueBefore: '2024-12-31', dueAfter: '2024-01-01' },
                { page: 1, limit: 10, sortBy: 'dueDate', sortOrder: 'asc' }
            )

            expect(prismaMock.task.findMany).toHaveBeenCalled()
        })
    })

    describe('getTasksByStatus', () => {
        it('应返回按状态分组的任务', async () => {
            const mockTasks = [
                { id: '1', status: 'NOT_STARTED', title: 'T1' },
                { id: '2', status: 'IN_PROGRESS', title: 'T2' },
            ]
            prismaMock.task.findMany.mockResolvedValue(mockTasks)

            const result = await taskService.getTasksByStatus()
            expect(result.NOT_STARTED).toHaveLength(1)
            expect(result.IN_PROGRESS).toHaveLength(1)
            expect(result.BLOCKED).toHaveLength(0)
            expect(result.DONE).toHaveLength(0)
            expect(result.CANCELLED).toHaveLength(0)
        })

        it('应支持按负责人筛选', async () => {
            prismaMock.task.findMany.mockResolvedValue([])

            await taskService.getTasksByStatus('u1')
            expect(prismaMock.task.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { assignedToId: 'u1' } })
            )
        })
    })

    describe('getTaskById', () => {
        it('应返回任务详情', async () => {
            const mockTask = { id: '1', title: 'Task', assignedTo: {}, project: {}, lead: {} }
            prismaMock.task.findUnique.mockResolvedValue(mockTask)

            const result = await taskService.getTaskById('1')
            expect(result).toEqual(mockTask)
        })

        it('任务不存在时抛出 NotFoundError', async () => {
            prismaMock.task.findUnique.mockResolvedValue(null)

            await expect(taskService.getTaskById('nonexistent')).rejects.toThrow('任务不存在')
        })
    })

    describe('createTask', () => {
        it('应创建任务', async () => {
            const mockCreated = { id: '1', title: 'New Task', status: 'NOT_STARTED' }
            prismaMock.task.create.mockResolvedValue(mockCreated)

            const result = await taskService.createTask({ title: 'New Task' })
            expect(result).toEqual(mockCreated)
        })

        it('应使用默认优先级 MEDIUM', async () => {
            prismaMock.task.create.mockResolvedValue({ id: '1' })

            await taskService.createTask({ title: 'Task' })
            expect(prismaMock.task.create).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ priority: 'MEDIUM' }) })
            )
        })
    })

    describe('updateTask', () => {
        it('任务不存在时抛出 NotFoundError', async () => {
            prismaMock.task.findUnique.mockResolvedValue(null)

            await expect(taskService.updateTask('nonexistent', {})).rejects.toThrow('任务不存在')
        })

        it('状态变为 DONE 时自动设置 completedAt', async () => {
            prismaMock.task.findUnique.mockResolvedValue({ id: '1', completedAt: null })
            prismaMock.task.update.mockResolvedValue({ id: '1', status: 'DONE' })

            await taskService.updateTask('1', { status: 'DONE' })
            expect(prismaMock.task.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ completedAt: expect.any(Date) }),
                })
            )
        })

        it('已完成任务不重复设置 completedAt', async () => {
            prismaMock.task.findUnique.mockResolvedValue({ id: '1', completedAt: new Date() })
            prismaMock.task.update.mockResolvedValue({ id: '1' })

            await taskService.updateTask('1', { status: 'DONE' })
            expect(prismaMock.task.update).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ completedAt: expect.any(Date) }),
                })
            )
        })
    })

    describe('deleteTask', () => {
        it('应成功删除任务', async () => {
            prismaMock.task.findUnique.mockResolvedValue({ id: '1' })
            prismaMock.task.delete.mockResolvedValue({ id: '1' })

            const result = await taskService.deleteTask('1')
            expect(result.success).toBe(true)
        })

        it('任务不存在时抛出 NotFoundError', async () => {
            prismaMock.task.findUnique.mockResolvedValue(null)

            await expect(taskService.deleteTask('nonexistent')).rejects.toThrow('任务不存在')
        })
    })

    describe('getTaskStats', () => {
        it('应返回任务统计', async () => {
            prismaMock.task.count.mockResolvedValueOnce(10) // total
            prismaMock.task.groupBy.mockResolvedValue([{ status: 'DONE', _count: 5 }, { status: 'IN_PROGRESS', _count: 5 }])
            prismaMock.task.count.mockResolvedValueOnce(2) // overdue

            const result = await taskService.getTaskStats()
            expect(result.total).toBe(10)
            expect(result.overdue).toBe(2)
        })

        it('应支持按负责人筛选', async () => {
            prismaMock.task.count.mockResolvedValue(0)
            prismaMock.task.groupBy.mockResolvedValue([])

            await taskService.getTaskStats('u1')
            expect(prismaMock.task.count).toHaveBeenCalled()
        })
    })
})
