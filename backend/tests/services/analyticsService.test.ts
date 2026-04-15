import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1. Hoist mock 对象
const prismaMock = vi.hoisted(() => ({
    lead: {
        groupBy: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
    },
    customer: {
        findMany: vi.fn(),
    },
    invoice: {
        findMany: vi.fn(),
    },
}))

// 2. Mock 模块
vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

// 3. 在 mock 之后导入服务
import { analyticsService } from '../../src/services/analyticsService'

describe('analyticsService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getSalesFunnel', () => {
        it('应该使用 groupBy 查询返回各阶段线索数量和百分比', async () => {
            // 模拟 groupBy 返回：NEW=10, CONTACTED=20, CONVERTED=5
            prismaMock.lead.groupBy.mockResolvedValue([
                { status: 'NEW', _count: { status: 10 } },
                { status: 'CONTACTED', _count: { status: 20 } },
                { status: 'CONVERTED', _count: { status: 5 } },
            ])

            const result = await analyticsService.getSalesFunnel({})

            // 验证使用了 groupBy 而非多次 count
            expect(prismaMock.lead.groupBy).toHaveBeenCalledWith(
                expect.objectContaining({
                    by: ['status'],
                    where: expect.objectContaining({ deletedAt: null }),
                    _count: { status: true },
                })
            )
            expect(prismaMock.lead.count).not.toHaveBeenCalled()

            // 验证返回结构：6 个阶段，未出现的阶段计数为 0
            expect(result).toHaveLength(6)
            const newStage = result.find(r => r.stage === 'NEW')
            expect(newStage?.count).toBe(10)
            expect(newStage?.percentage).toBe(29) // 10/35 * 100 ≈ 28.57 → 29

            const contactedStage = result.find(r => r.stage === 'CONTACTED')
            expect(contactedStage?.count).toBe(20)
            expect(contactedStage?.percentage).toBe(57) // 20/35 * 100 ≈ 57.14 → 57

            const convertedStage = result.find(r => r.stage === 'CONVERTED')
            expect(convertedStage?.count).toBe(5)
            expect(convertedStage?.percentage).toBe(14) // 5/35 * 100 ≈ 14.28 → 14

            // 未出现的阶段应为 0
            const qualifiedStage = result.find(r => r.stage === 'QUALIFIED')
            expect(qualifiedStage?.count).toBe(0)
            expect(qualifiedStage?.percentage).toBe(0)
        })

        it('应该在无数据时返回所有阶段计数为 0', async () => {
            prismaMock.lead.groupBy.mockResolvedValue([])

            const result = await analyticsService.getSalesFunnel({})

            expect(result).toHaveLength(6)
            result.forEach(item => {
                expect(item.count).toBe(0)
                expect(item.percentage).toBe(0)
            })
        })

        it('应该正确处理日期范围过滤', async () => {
            prismaMock.lead.groupBy.mockResolvedValue([
                { status: 'NEW', _count: { status: 3 } },
            ])

            const params = { startDate: '2026-01-01', endDate: '2026-03-31' }
            await analyticsService.getSalesFunnel(params)

            // 验证 groupBy 的 where 条件包含日期过滤
            expect(prismaMock.lead.groupBy).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        deletedAt: null,
                        createdAt: expect.objectContaining({
                            gte: expect.any(Date),
                            lte: expect.any(Date),
                        }),
                    }),
                })
            )
        })

        it('应该仅调用一次 groupBy 查询（非 N+1）', async () => {
            prismaMock.lead.groupBy.mockResolvedValue([])

            await analyticsService.getSalesFunnel({})

            // groupBy 应仅被调用 1 次，而非 6 次 count
            expect(prismaMock.lead.groupBy).toHaveBeenCalledTimes(1)
        })
    })
})
