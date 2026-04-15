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

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

// 3. 在 mock 之后导入服务
import { analyticsService } from '../../src/services/analyticsService'

describe('analyticsService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getSalesFunnel', () => {
        it('应该使用 groupBy 查询返回各阶段线索数量和百分比', async () => {
            prismaMock.lead.groupBy.mockResolvedValue([
                { status: 'NEW', _count: { status: 10 } },
                { status: 'CONTACTED', _count: { status: 20 } },
                { status: 'CONVERTED', _count: { status: 5 } },
            ])

            const result = await analyticsService.getSalesFunnel({})

            expect(prismaMock.lead.groupBy).toHaveBeenCalledWith(
                expect.objectContaining({
                    by: ['status'],
                    where: expect.objectContaining({ deletedAt: null }),
                    _count: { status: true },
                })
            )
            expect(prismaMock.lead.count).not.toHaveBeenCalled()
            expect(result).toHaveLength(6)
            const newStage = result.find(r => r.stage === 'NEW')
            expect(newStage?.count).toBe(10)
            expect(newStage?.percentage).toBe(29)
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
            expect(prismaMock.lead.groupBy).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
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
            expect(prismaMock.lead.groupBy).toHaveBeenCalledTimes(1)
        })

        it('应该仅使用 startDate 过滤', async () => {
            prismaMock.lead.groupBy.mockResolvedValue([])
            await analyticsService.getSalesFunnel({ startDate: '2026-01-01' })
            expect(prismaMock.lead.groupBy).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        createdAt: expect.objectContaining({ gte: expect.any(Date) }),
                    }),
                })
            )
        })

        it('应该仅使用 endDate 过滤', async () => {
            prismaMock.lead.groupBy.mockResolvedValue([])
            await analyticsService.getSalesFunnel({ endDate: '2026-12-31' })
            expect(prismaMock.lead.groupBy).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        createdAt: expect.objectContaining({ lte: expect.any(Date) }),
                    }),
                })
            )
        })
    })

    describe('getTrend', () => {
        it('应该按月返回趋势数据', async () => {
            prismaMock.lead.findMany.mockResolvedValue([
                { createdAt: new Date('2026-01-15'), status: 'NEW' },
                { createdAt: new Date('2026-01-20'), status: 'CONVERTED' },
                { createdAt: new Date('2026-02-10'), status: 'NEW' },
            ])

            const result = await analyticsService.getTrend('month', 6)
            expect(result.length).toBeGreaterThan(0)
            const janData = result.find(r => r.period === '2026-01')
            expect(janData?.total).toBe(2)
            expect(janData?.converted).toBe(1)
            expect(janData?.conversionRate).toBe(50)
        })

        it('应该按季度返回趋势数据', async () => {
            prismaMock.lead.findMany.mockResolvedValue([
                { createdAt: new Date('2026-01-15'), status: 'NEW' },
                { createdAt: new Date('2026-02-20'), status: 'CONVERTED' },
            ])

            const result = await analyticsService.getTrend('quarter', 12)
            expect(result.length).toBeGreaterThan(0)
            const q1 = result.find(r => r.period === '2026-Q1')
            expect(q1?.total).toBe(2)
            expect(q1?.converted).toBe(1)
        })

        it('无数据时转换率应为 0', async () => {
            prismaMock.lead.findMany.mockResolvedValue([])
            const result = await analyticsService.getTrend()
            if (result.length > 0) {
                result.forEach(item => {
                    expect(item.conversionRate).toBe(0)
                })
            }
        })
    })

    describe('getChannelMetrics', () => {
        it('应该按渠道返回效果数据', async () => {
            prismaMock.lead.findMany.mockResolvedValue([
                { id: 'lead-1', sourceChannel: 'WECHAT', status: 'CONVERTED', score: 80 },
                { id: 'lead-2', sourceChannel: 'WEBSITE', status: 'NEW', score: 50 },
                { id: 'lead-3', sourceChannel: null, status: 'CONTACTED', score: 30 },
            ] as any)
            prismaMock.customer.findMany.mockResolvedValue([
                {
                    leadId: 'lead-1',
                    projects: [{
                        invoices: [{ paidAmount: 1000 }, { paidAmount: 2000 }]
                    }]
                },
            ] as any)

            const result = await analyticsService.getChannelMetrics({})
            expect(result.length).toBe(3) // WECHAT, WEBSITE, unknown
            const wechat = result.find(r => r.channel === 'WECHAT')
            expect(wechat?.leadCount).toBe(1)
            expect(wechat?.convertedCount).toBe(1)
            expect(wechat?.conversionRate).toBe(100)
            expect(wechat?.revenue).toBe(3000)

            const website = result.find(r => r.channel === 'WEBSITE')
            expect(website?.leadCount).toBe(1)
            expect(website?.convertedCount).toBe(0)
            expect(website?.conversionRate).toBe(0)

            const unknown = result.find(r => r.channel === 'unknown')
            expect(unknown?.leadCount).toBe(1)
        })

        it('无转化线索时不应查客户营收', async () => {
            prismaMock.lead.findMany.mockResolvedValue([
                { id: 'lead-1', sourceChannel: 'WECHAT', status: 'NEW', score: 50 },
            ] as any)

            const result = await analyticsService.getChannelMetrics({})
            expect(prismaMock.customer.findMany).not.toHaveBeenCalled()
            expect(result[0].revenue).toBe(0)
        })
    })

    describe('getRevenueTrend', () => {
        it('应该按月返回营收趋势', async () => {
            prismaMock.invoice.findMany.mockResolvedValue([
                { issueDate: new Date('2026-01-15'), paidAmount: 5000 },
                { issueDate: new Date('2026-01-20'), paidAmount: 3000 },
                { issueDate: new Date('2026-02-10'), paidAmount: 7000 },
            ] as any)

            const result = await analyticsService.getRevenueTrend('month', 6)
            expect(result.length).toBeGreaterThan(0)
            const jan = result.find(r => r.period === '2026-01')
            expect(jan?.revenue).toBe(8000)
            const feb = result.find(r => r.period === '2026-02')
            expect(feb?.revenue).toBe(7000)
        })

        it('应该按季度返回营收趋势', async () => {
            prismaMock.invoice.findMany.mockResolvedValue([
                { issueDate: new Date('2026-01-15'), paidAmount: 5000 },
                { issueDate: new Date('2026-02-10'), paidAmount: 3000 },
            ] as any)

            const result = await analyticsService.getRevenueTrend('quarter', 12)
            expect(result.length).toBeGreaterThan(0)
        })

        it('无发票时也应返回初始月份', async () => {
            prismaMock.invoice.findMany.mockResolvedValue([])
            const result = await analyticsService.getRevenueTrend('month', 6)
            expect(result.length).toBe(6)
            result.forEach(item => {
                expect(item.revenue).toBe(0)
            })
        })

        it('应处理 paidAmount 为 null 的情况', async () => {
            prismaMock.invoice.findMany.mockResolvedValue([
                { issueDate: new Date('2026-01-15'), paidAmount: null },
            ] as any)

            const result = await analyticsService.getRevenueTrend('month', 6)
            const jan = result.find(r => r.period === '2026-01')
            expect(jan?.revenue).toBe(0)
        })
    })

    describe('getTeamPerformance', () => {
        it('应该按销售人员返回绩效数据', async () => {
            prismaMock.lead.findMany.mockResolvedValue([
                {
                    assignedToId: 'user-1',
                    status: 'CONVERTED',
                    assignedTo: { id: 'user-1', name: '张三', avatarUrl: 'avatar1.jpg' },
                },
                {
                    assignedToId: 'user-1',
                    status: 'IN_PROGRESS',
                    assignedTo: { id: 'user-1', name: '张三', avatarUrl: 'avatar1.jpg' },
                },
                {
                    assignedToId: 'user-2',
                    status: 'NEW',
                    assignedTo: { id: 'user-2', name: '李四', avatarUrl: null },
                },
            ] as any)

            const result = await analyticsService.getTeamPerformance({})
            expect(result).toHaveLength(2)

            const zhang = result.find(r => r.userId === 'user-1')
            expect(zhang?.name).toBe('张三')
            expect(zhang?.total).toBe(2)
            expect(zhang?.converted).toBe(1)
            expect(zhang?.inProgress).toBe(1)
            expect(zhang?.conversionRate).toBe(50)
        })

        it('无分配人员的线索应跳过', async () => {
            prismaMock.lead.findMany.mockResolvedValue([
                {
                    assignedToId: 'user-1',
                    status: 'CONVERTED',
                    assignedTo: { id: 'user-1', name: '张三', avatarUrl: null },
                },
                {
                    assignedToId: 'user-2',
                    status: 'NEW',
                    assignedTo: null, // 无分配人员
                },
            ] as any)

            const result = await analyticsService.getTeamPerformance({})
            expect(result).toHaveLength(1)
        })

        it('应按转化数排名', async () => {
            prismaMock.lead.findMany.mockResolvedValue([
                {
                    assignedToId: 'user-1',
                    status: 'CONVERTED',
                    assignedTo: { id: 'user-1', name: '张三', avatarUrl: null },
                },
                {
                    assignedToId: 'user-2',
                    status: 'CONVERTED',
                    assignedTo: { id: 'user-2', name: '李四', avatarUrl: null },
                },
                {
                    assignedToId: 'user-2',
                    status: 'CONVERTED',
                    assignedTo: { id: 'user-2', name: '李四', avatarUrl: null },
                },
            ] as any)

            const result = await analyticsService.getTeamPerformance({})
            expect(result[0].name).toBe('李四') // 2 conversions
            expect(result[1].name).toBe('张三') // 1 conversion
        })

        it('应处理日期范围过滤', async () => {
            prismaMock.lead.findMany.mockResolvedValue([])
            await analyticsService.getTeamPerformance({ startDate: '2026-01-01' })
            expect(prismaMock.lead.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        createdAt: expect.objectContaining({ gte: expect.any(Date) }),
                    }),
                })
            )
        })
    })

    describe('getForecast', () => {
        it('数据不足时应返回提示信息', async () => {
            prismaMock.lead.findMany.mockResolvedValue([])
            const result = await analyticsService.getForecast(3)
            expect(result.message).toBe('数据不足，无法预测')
            expect(result.forecast).toHaveLength(0)
        })

        it('应该基于历史数据生成预测', async () => {
            // 提供足够的历史数据（6个月）
            const leads: Array<{ createdAt: Date; status: string }> = []
            for (let i = 5; i >= 0; i--) {
                const d = new Date()
                d.setMonth(d.getMonth() - i)
                leads.push({ createdAt: new Date(d), status: 'NEW' })
                leads.push({ createdAt: new Date(d), status: 'CONVERTED' })
            }
            prismaMock.lead.findMany.mockResolvedValue(leads as any)

            const result = await analyticsService.getForecast(3)
            expect(result.forecast).toHaveLength(3)
            expect(result.forecast[0]).toHaveProperty('predictedLeads')
            expect(result.forecast[0]).toHaveProperty('predictedConversions')
            expect(result.forecast[0]).toHaveProperty('confidence')
            expect(result.forecast[0].confidence).toBeLessThanOrEqual(90)
        })

        it('预测线索数不应为负数', async () => {
            // 提供下降趋势的数据
            const leads: Array<{ createdAt: Date; status: string }> = []
            for (let i = 5; i >= 0; i--) {
                const d = new Date()
                d.setMonth(d.getMonth() - i)
                // 递减数量
                for (let j = 0; j < i + 1; j++) {
                    leads.push({ createdAt: new Date(d), status: 'NEW' })
                }
            }
            prismaMock.lead.findMany.mockResolvedValue(leads as any)

            const result = await analyticsService.getForecast(6)
            result.forecast.forEach(f => {
                expect(f.predictedLeads).toBeGreaterThanOrEqual(0)
            })
        })

        it('信心度应随预测时间递减', async () => {
            const leads: Array<{ createdAt: Date; status: string }> = []
            for (let i = 5; i >= 0; i--) {
                const d = new Date()
                d.setMonth(d.getMonth() - i)
                leads.push({ createdAt: new Date(d), status: 'NEW' })
                leads.push({ createdAt: new Date(d), status: 'CONVERTED' })
            }
            prismaMock.lead.findMany.mockResolvedValue(leads as any)

            const result = await analyticsService.getForecast(4)
            for (let i = 1; i < result.forecast.length; i++) {
                expect(result.forecast[i].confidence).toBeLessThanOrEqual(
                    result.forecast[i - 1].confidence
                )
            }
        })

        it('仅有1个数据点时应返回数据不足', async () => {
            const d = new Date()
            prismaMock.lead.findMany.mockResolvedValue([
                { createdAt: d, status: 'NEW' },
            ] as any)

            const result = await analyticsService.getForecast(3)
            expect(result.message).toBe('数据不足，无法预测')
        })
    })
})
