import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    lead: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
        updateMany: vi.fn(),
    },
    customer: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
    },
    activity: {
        create: vi.fn(),
        findMany: vi.fn(),
    },
    user: {
        findUnique: vi.fn(),
        create: vi.fn(),
    },
    role: {
        findUnique: vi.fn(),
    },
    $transaction: vi.fn((fnOrCmds: unknown) => {
        if (typeof fnOrCmds === 'function') {
            return fnOrCmds({
                lead: { create: prismaMock.lead.create, update: prismaMock.lead.update, findFirst: prismaMock.lead.findFirst },
                customer: { create: prismaMock.customer.create, findFirst: prismaMock.customer.findFirst },
                user: { create: prismaMock.user.create, findUnique: prismaMock.user.findUnique },
                role: { findUnique: prismaMock.role.findUnique },
                activity: { create: prismaMock.activity.create },
            })
        }
        return Promise.all(fnOrCmds as unknown[])
    }),
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
    config: { cors: { origins: ['http://localhost:3000'] } },
}))

vi.mock('../../src/services/scoringService.js', () => ({
    scoringService: { updateLeadScore: vi.fn().mockResolvedValue({}) },
}))

vi.mock('../../src/services/webhookService.js', () => ({
    webhookService: { emit: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { leadService } from '../../src/services/leadService.js'

describe('LeadService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getLeads', () => {
        it('应返回分页线索列表', async () => {
            prismaMock.lead.findMany.mockResolvedValue([{ id: '1', contactName: 'John' }])
            prismaMock.lead.count.mockResolvedValue(1)

            const result = await leadService.getLeads({}, { page: 1, limit: 10 })
            expect(result.data).toHaveLength(1)
            expect(result.pagination.total).toBe(1)
        })

        it('应支持搜索和筛选', async () => {
            prismaMock.lead.findMany.mockResolvedValue([])
            prismaMock.lead.count.mockResolvedValue(0)

            await leadService.getLeads(
                { status: 'NEW', assignedToId: 'u1', sourceChannel: 'web', country: 'SG', tags: ['vip'], search: 'john' },
                { page: 1, limit: 10, sortBy: 'score', sortOrder: 'asc' }
            )
            expect(prismaMock.lead.findMany).toHaveBeenCalled()
        })
    })

    describe('getLeadById', () => {
        it('应返回线索详情', async () => {
            const mockLead = { id: '1', contactName: 'John', tasks: [], activities: [] }
            prismaMock.lead.findUnique.mockResolvedValue(mockLead)

            const result = await leadService.getLeadById('1')
            expect(result).toEqual(mockLead)
        })

        it('线索不存在时抛出 NotFoundError', async () => {
            prismaMock.lead.findUnique.mockResolvedValue(null)

            await expect(leadService.getLeadById('nonexistent')).rejects.toThrow('线索不存在')
        })
    })

    describe('checkDuplicates', () => {
        it('无邮箱和电话时返回空列表', async () => {
            const result = await leadService.checkDuplicates()
            expect(result.leads).toEqual([])
            expect(result.customers).toEqual([])
        })

        it('应检测重复线索和客户', async () => {
            prismaMock.lead.findMany.mockResolvedValue([{ id: '1', contactName: 'John' }])
            prismaMock.customer.findMany.mockResolvedValue([{ id: 'c1', contactName: 'John' }])

            const result = await leadService.checkDuplicates('john@test.com', '123456')
            expect(result.hasDuplicates).toBe(true)
        })

        it('应支持排除线索ID', async () => {
            prismaMock.lead.findMany.mockResolvedValue([])
            prismaMock.customer.findMany.mockResolvedValue([])

            await leadService.checkDuplicates('john@test.com', undefined, 'exclude-id')
            expect(prismaMock.lead.findMany).toHaveBeenCalled()
        })
    })

    describe('createLead', () => {
        it('应成功创建线索', async () => {
            prismaMock.lead.findFirst.mockResolvedValue(null)
            const mockCreated = { id: '1', contactName: 'John', assignedTo: null }
            prismaMock.lead.create.mockResolvedValue(mockCreated)

            const result = await leadService.createLead({
                contactName: 'John',
                email: 'john@test.com',
                sourceChannel: 'web',
            })

            expect(result).toEqual(mockCreated)
        })

        it('重复邮箱或电话时抛出 ConflictError', async () => {
            prismaMock.lead.findFirst.mockResolvedValue({ id: 'existing' })

            await expect(
                leadService.createLead({ contactName: 'John', email: 'john@test.com', sourceChannel: 'web' })
            ).rejects.toThrow('已存在相同邮箱或电话的线索')
        })
    })

    describe('updateLead', () => {
        it('线索不存在时抛出 NotFoundError', async () => {
            prismaMock.lead.findUnique.mockResolvedValue(null)

            await expect(leadService.updateLead('nonexistent', {})).rejects.toThrow('线索不存在')
        })

        it('应成功更新线索', async () => {
            prismaMock.lead.findUnique.mockResolvedValue({ id: '1', contactName: 'John' })
            prismaMock.lead.update.mockResolvedValue({ id: '1', contactName: 'Updated', assignedTo: null })

            const result = await leadService.updateLead('1', { contactName: 'Updated' }, 'updater-1')
            expect(result.contactName).toBe('Updated')
        })
    })

    describe('addNote', () => {
        it('应添加线索备注', async () => {
            prismaMock.lead.findUnique.mockResolvedValue({ id: '1' })
            prismaMock.activity.create.mockResolvedValue({ id: 'a1', description: 'Note content' })

            const result = await leadService.addNote('1', 'Note content', 'u1')
            expect(result.description).toBe('Note content')
        })

        it('线索不存在时抛出 NotFoundError', async () => {
            prismaMock.lead.findUnique.mockResolvedValue(null)

            await expect(leadService.addNote('nonexistent', 'Note', 'u1')).rejects.toThrow('线索不存在')
        })
    })

    describe('assignLead', () => {
        it('应分配线索', async () => {
            prismaMock.lead.findUnique.mockResolvedValue({ id: '1', assignedToId: null })
            prismaMock.user.findUnique.mockResolvedValue({ id: 'u2', name: 'Sales Rep' })
            prismaMock.lead.update.mockResolvedValue({ id: '1', assignedToId: 'u2', assignedTo: { name: 'Sales Rep' } })

            const result = await leadService.assignLead('1', 'u2', 'assigner-1')
            expect(result).toBeDefined()
        })

        it('线索不存在时抛出 NotFoundError', async () => {
            prismaMock.lead.findUnique.mockResolvedValue(null)

            await expect(leadService.assignLead('nonexistent', 'u2', 'assigner-1')).rejects.toThrow('线索不存在')
        })

        it('被分配用户不存在时抛出 NotFoundError', async () => {
            prismaMock.lead.findUnique.mockResolvedValue({ id: '1' })
            prismaMock.user.findUnique.mockResolvedValue(null)

            await expect(leadService.assignLead('1', 'nonexistent', 'assigner-1')).rejects.toThrow('被分配的用户不存在')
        })
    })

    describe('deleteLead', () => {
        it('应成功删除线索', async () => {
            prismaMock.lead.findUnique.mockResolvedValue({ id: '1' })
            prismaMock.lead.delete.mockResolvedValue({ id: '1' })

            const result = await leadService.deleteLead('1')
            expect(result.success).toBe(true)
        })

        it('线索不存在时抛出 NotFoundError', async () => {
            prismaMock.lead.findUnique.mockResolvedValue(null)

            await expect(leadService.deleteLead('nonexistent')).rejects.toThrow('线索不存在')
        })
    })

    describe('getRecentActivities', () => {
        it('应返回最近活动', async () => {
            const mockActivities = [{ id: '1', actionType: 'CREATED' }]
            prismaMock.activity.findMany.mockResolvedValue(mockActivities)

            const result = await leadService.getRecentActivities(10)
            expect(result).toEqual(mockActivities)
        })
    })

    describe('getLeadStats', () => {
        it('应返回线索统计', async () => {
            prismaMock.lead.count.mockResolvedValue(50)
            prismaMock.lead.groupBy.mockResolvedValue([
                { status: 'NEW', _count: 20 },
                { status: 'CONTACTED', _count: 30 },
            ])
            prismaMock.lead.findMany.mockResolvedValue([])

            const result = await leadService.getLeadStats()
            expect(result.total).toBe(50)
            expect(result.byStatus).toEqual({ NEW: 20, CONTACTED: 30 })
            expect(result.trend).toBeDefined()
        })
    })
})
