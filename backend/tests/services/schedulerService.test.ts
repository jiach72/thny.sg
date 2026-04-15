import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    systemSetting: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
    },
    emailLog: {
        deleteMany: vi.fn(),
    },
    activity: {
        create: vi.fn(),
    },
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

vi.mock('../../src/services/scoringService.js', () => ({
    scoringService: {
        batchUpdateScores: vi.fn().mockResolvedValue({ updated: 10, failed: 0 }),
    },
}))

vi.mock('../../src/services/workflowService.js', () => ({
    workflowService: {
        batchAutoAssign: vi.fn().mockResolvedValue({ assigned: 3 }),
    },
}))

vi.mock('../../src/services/invoiceService.js', () => ({
    invoiceService: {
        // checkAndMarkOverdue 在 schedulerService 中通过 (invoiceService as any) 调用
        // 此方法在 invoiceService 中可能不存在，需要提供模拟
    },
}))

import { schedulerService } from '../../src/services/schedulerService'

describe('SchedulerService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        prismaMock.systemSetting.findUnique.mockResolvedValue(null)
    })

    describe('initialize', () => {
        it('should register default tasks', async () => {
            await schedulerService.initialize()

            const tasks = schedulerService.getTasksStatus()

            expect(tasks.length).toBeGreaterThanOrEqual(4)
            expect(tasks.map(t => t.name)).toContain('BATCH_SCORE_UPDATE')
            expect(tasks.map(t => t.name)).toContain('CHECK_OVERDUE_INVOICES')
            expect(tasks.map(t => t.name)).toContain('AUTO_ASSIGN_LEADS')
            expect(tasks.map(t => t.name)).toContain('CLEANUP_OLD_LOGS')
        })
    })

    describe('registerTask', () => {
        it('should register a custom task', async () => {
            await schedulerService.initialize()

            schedulerService.registerTask({
                name: 'CUSTOM_TASK',
                cronExpression: '0 0 * * *',
                handler: async () => ({ done: true }),
                enabled: true,
            })

            const tasks = schedulerService.getTasksStatus()
            expect(tasks.map(t => t.name)).toContain('CUSTOM_TASK')
        })
    })

    describe('runTask', () => {
        it('should return error for non-existent task', async () => {
            const result = await schedulerService.runTask('NON_EXISTENT')

            expect(result.success).toBe(false)
            expect(result.error).toBe('任务不存在')
        })

        it('should execute BATCH_SCORE_UPDATE task successfully', async () => {
            prismaMock.activity.create.mockResolvedValue({ id: 'act-1' })

            await schedulerService.initialize()
            const result = await schedulerService.runTask('BATCH_SCORE_UPDATE')

            expect(result.success).toBe(true)
            expect(result.taskName).toBe('BATCH_SCORE_UPDATE')
        })

        it('should execute CLEANUP_OLD_LOGS task', async () => {
            prismaMock.emailLog.deleteMany.mockResolvedValue({ count: 50 })
            prismaMock.activity.create.mockResolvedValue({ id: 'act-1' })

            await schedulerService.initialize()
            const result = await schedulerService.runTask('CLEANUP_OLD_LOGS')

            expect(result.success).toBe(true)
            expect(prismaMock.emailLog.deleteMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: 'SENT',
                    }),
                })
            )
        })
    })

    describe('triggerTask', () => {
        it('should trigger task manually', async () => {
            prismaMock.activity.create.mockResolvedValue({ id: 'act-1' })

            await schedulerService.initialize()
            const result = await schedulerService.triggerTask('BATCH_SCORE_UPDATE')

            expect(result.success).toBe(true)
        })
    })

    describe('updateTask', () => {
        it('should update task enabled status', async () => {
            prismaMock.systemSetting.upsert.mockResolvedValue({})
            await schedulerService.initialize()

            const result = await schedulerService.updateTask('BATCH_SCORE_UPDATE', { enabled: false })

            expect(result).toBe(true)
        })

        it('should return false for non-existent task', async () => {
            await schedulerService.initialize()

            const result = await schedulerService.updateTask('NON_EXISTENT', { enabled: false })

            expect(result).toBe(false)
        })
    })

    describe('calculateNextRun', () => {
        it('should calculate next run for interval pattern', () => {
            const nextRun = schedulerService.calculateNextRun('*/30 * * * *')
            expect(nextRun).toBeInstanceOf(Date)
            expect(nextRun.getTime()).toBeGreaterThan(Date.now() - 1000)
        })

        it('should calculate next run for daily pattern', () => {
            const nextRun = schedulerService.calculateNextRun('0 2 * * *')
            expect(nextRun).toBeInstanceOf(Date)
        })
    })

    describe('getTasksStatus', () => {
        it('should return status of all registered tasks', async () => {
            await schedulerService.initialize()

            const tasks = schedulerService.getTasksStatus()

            tasks.forEach(task => {
                expect(task).toHaveProperty('name')
                expect(task).toHaveProperty('enabled')
                expect(task).toHaveProperty('cronExpression')
            })
        })
    })
})
