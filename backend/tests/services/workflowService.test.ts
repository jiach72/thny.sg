import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1. 提升 mock 对象
const prismaMock = vi.hoisted(() => ({
    user: {
        findMany: vi.fn(),
    },
    lead: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
    },
    task: {
        findMany: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
    },
    appointment: {
        findMany: vi.fn(),
    },
    activity: {
        create: vi.fn(),
    },
    systemSetting: {
        findUnique: vi.fn(),
    },
}))

// 2. Mock 模块
vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

// 3. 导入被测模块
import { workflowService } from '../../src/services/workflowService'

describe('WorkflowService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ==================== 团队工作负载 ====================

    describe('getTeamWorkload', () => {
        it('应计算每个销售的工作负载', async () => {
            prismaMock.user.findMany.mockResolvedValue([
                { id: 'user-1', name: 'Alice' },
                { id: 'user-2', name: 'Bob' },
            ])
            // Alice: 3 线索, 2 任务 => 工作负载 = 3*2 + 2 = 8
            // Bob: 1 线索, 0 任务 => 工作负载 = 1*2 + 0 = 2
            prismaMock.lead.count
                .mockResolvedValueOnce(3) // Alice 线索
                .mockResolvedValueOnce(1) // Bob 线索
            prismaMock.task.count
                .mockResolvedValueOnce(2) // Alice 任务
                .mockResolvedValueOnce(0) // Bob 任务

            const result = await workflowService.getTeamWorkload()

            expect(result).toHaveLength(2)
            expect(result[0]).toEqual(expect.objectContaining({
                userId: 'user-1',
                userName: 'Alice',
                activeLeads: 3,
                activeTasks: 2,
                workload: 8,
            }))
            expect(result[1].workload).toBe(2)
        })

        it('无销售用户时返回空数组', async () => {
            prismaMock.user.findMany.mockResolvedValue([])

            const result = await workflowService.getTeamWorkload()

            expect(result).toEqual([])
        })
    })

    // ==================== 智能分配 ====================

    describe('autoAssignLead', () => {
        it('线索不存在时应抛出错误', async () => {
            prismaMock.lead.findUnique.mockResolvedValue(null)

            await expect(workflowService.autoAssignLead('lead-999'))
                .rejects.toThrow('线索不存在')
        })

        it('线索已分配时应抛出错误', async () => {
            prismaMock.lead.findUnique.mockResolvedValue({
                id: 'lead-1',
                assignedToId: 'user-1',
                assignedTo: { id: 'user-1', name: 'Alice' },
            })

            await expect(workflowService.autoAssignLead('lead-1'))
                .rejects.toThrow('线索已分配')
        })

        it('无可用销售人员时应抛出错误', async () => {
            prismaMock.lead.findUnique.mockResolvedValue({
                id: 'lead-1',
                assignedToId: null,
                assignedTo: null,
            })
            prismaMock.systemSetting.findUnique.mockResolvedValue(null)
            prismaMock.user.findMany.mockResolvedValue([]) // 没有销售人员

            await expect(workflowService.autoAssignLead('lead-1'))
                .rejects.toThrow('没有可用的销售人员')
        })
    })

    // ==================== 批量分配 ====================

    describe('batchAutoAssign', () => {
        it('无未分配线索时应返回 0', async () => {
            prismaMock.lead.findMany.mockResolvedValue([])

            const result = await workflowService.batchAutoAssign()

            expect(result).toEqual({ assigned: 0, failed: 0 })
        })
    })

    // ==================== 分配规则匹配 ====================

    describe('matchAssignmentRule', () => {
        it('无规则时返回 null', async () => {
            prismaMock.systemSetting.findUnique.mockResolvedValue(null)

            const result = await workflowService.matchAssignmentRule({ sourceChannel: 'website' })

            expect(result).toBeNull()
        })

        it('匹配到 userId 规则时返回对应用户', async () => {
            prismaMock.systemSetting.findUnique.mockResolvedValue({
                key: 'ASSIGNMENT_RULES',
                value: JSON.stringify([
                    { name: '网站线索', field: 'sourceChannel', value: 'website', assignToUserId: 'user-5' },
                ]),
            })

            const result = await workflowService.matchAssignmentRule({ sourceChannel: 'website' })

            expect(result).toBe('user-5')
        })

        it('字段值不匹配时返回 null', async () => {
            prismaMock.systemSetting.findUnique.mockResolvedValue({
                key: 'ASSIGNMENT_RULES',
                value: JSON.stringify([
                    { name: '网站线索', field: 'sourceChannel', value: 'website', assignToUserId: 'user-5' },
                ]),
            })

            const result = await workflowService.matchAssignmentRule({ sourceChannel: 'referral' })

            expect(result).toBeNull()
        })

        it('规则 JSON 格式错误时返回 null', async () => {
            prismaMock.systemSetting.findUnique.mockResolvedValue({
                key: 'ASSIGNMENT_RULES',
                value: 'invalid-json',
            })

            const result = await workflowService.matchAssignmentRule({ sourceChannel: 'website' })

            expect(result).toBeNull()
        })
    })

    // ==================== 跟进任务创建 ====================

    describe('createFollowUpTask', () => {
        it('高分线索（≥50）应创建 HIGH 优先级任务', async () => {
            prismaMock.lead.findUnique.mockResolvedValue({
                contactName: '张三',
                companyName: 'ABC 公司',
                score: 75,
            })
            prismaMock.task.create.mockResolvedValue({ id: 'task-1', priority: 'HIGH' })

            await workflowService.createFollowUpTask('lead-1', 'user-1')

            expect(prismaMock.task.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        priority: 'HIGH',
                        slaHours: 2,
                        title: '首次跟进: 张三',
                        tags: ['首次跟进', '自动创建'],
                    }),
                })
            )
        })

        it('中分线索（30-49）应创建 MEDIUM 优先级任务', async () => {
            prismaMock.lead.findUnique.mockResolvedValue({
                contactName: '李四',
                companyName: null,
                score: 35,
            })
            prismaMock.task.create.mockResolvedValue({ id: 'task-1', priority: 'MEDIUM' })

            await workflowService.createFollowUpTask('lead-2', 'user-1')

            expect(prismaMock.task.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        priority: 'MEDIUM',
                        slaHours: 24,
                    }),
                })
            )
        })

        it('低分线索（<30）应创建 LOW 优先级任务', async () => {
            prismaMock.lead.findUnique.mockResolvedValue({
                contactName: '王五',
                companyName: null,
                score: 10,
            })
            prismaMock.task.create.mockResolvedValue({ id: 'task-1', priority: 'LOW' })

            await workflowService.createFollowUpTask('lead-3', 'user-1')

            expect(prismaMock.task.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        priority: 'LOW',
                        slaHours: 48,
                    }),
                })
            )
        })
    })

    // ==================== SOP 模板 ====================

    describe('getSopSteps', () => {
        it('应返回公司注册的 SOP 步骤', async () => {
            const steps = await workflowService.getSopSteps('company_registration')

            expect(steps).toHaveLength(7)
            expect(steps[0]).toContain('确认注册需求')
        })

        it('应返回家族办公室的 SOP 步骤', async () => {
            const steps = await workflowService.getSopSteps('family_office')

            expect(steps).toHaveLength(7)
            expect(steps[0]).toContain('初步需求评估')
        })

        it('未知类型应返回默认 SOP', async () => {
            const steps = await workflowService.getSopSteps('unknown_service')

            expect(steps).toHaveLength(7)
            expect(steps[0]).toContain('首次电话')
        })
    })

    // ==================== SOP 任务序列 ====================

    describe('createSopTasks', () => {
        it('应创建 7 个任务并首任务为 HIGH 优先', async () => {
            prismaMock.task.create.mockResolvedValue({ id: 'task-sop' })

            const tasks = await workflowService.createSopTasks('lead-1', 'user-1', 'company_registration')

            expect(tasks).toHaveLength(7)
            expect(prismaMock.task.create).toHaveBeenCalledTimes(7)

            // 第一个任务应为 HIGH 优先
            const firstCall = prismaMock.task.create.mock.calls[0][0]
            expect(firstCall.data.priority).toBe('HIGH')
            expect(firstCall.data.tags).toContain('SOP')

            // 第二个任务应为 MEDIUM
            const secondCall = prismaMock.task.create.mock.calls[1][0]
            expect(secondCall.data.priority).toBe('MEDIUM')
        })
    })

    // ==================== 逾期统计 ====================

    describe('getOverdueStats', () => {
        it('应返回逾期任务、逾期线索和今日到期数', async () => {
            prismaMock.task.count
                .mockResolvedValueOnce(3)  // 逾期任务
                .mockResolvedValueOnce(1)  // 今日到期
            prismaMock.lead.count.mockResolvedValue(2) // 逾期线索

            const result = await workflowService.getOverdueStats('user-1')

            expect(result).toEqual({
                overdueTasks: 3,
                overdueLeads: 2,
                upcomingToday: 1,
            })
        })
    })
})
