import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1. 提升 mock 对象
const prismaMock = vi.hoisted(() => ({
    customer: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    activity: {
        findMany: vi.fn(),
    },
    appointment: {
        findMany: vi.fn(),
    },
}))

// 2. Mock 模块
vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

// Mock webhookService
vi.mock('../../src/services/webhookService.js', () => ({
    webhookService: { emit: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

// 3. 导入被测模块
import { customerService } from '../../src/services/customerService.js'

describe('customerService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getCustomerList', () => {
        it('应该成功返回分页后的客户列表和元信息', async () => {
            const mockCustomers = [
                { id: 'c1', contactName: 'Alice', kycStatus: 'APPROVED' },
                { id: 'c2', contactName: 'Bob', kycStatus: 'PENDING' }
            ]
            prismaMock.customer.findMany.mockResolvedValue(mockCustomers)
            prismaMock.customer.count.mockResolvedValue(2)

            const result = await customerService.getCustomerList({ page: 1, limit: 10, search: 'A' })

            expect(result.data).toHaveLength(2)
            expect(result.pagination.total).toBe(2)
            expect(result.pagination.totalPages).toBe(1)
            expect(prismaMock.customer.findMany).toHaveBeenCalledTimes(1)
            expect(prismaMock.customer.count).toHaveBeenCalledTimes(1)
        })
    })

    describe('getStats', () => {
        it('应该聚合各维度的统计数据', async () => {
            prismaMock.customer.count
                .mockResolvedValueOnce(100) // total
                .mockResolvedValueOnce(60)  // kycApproved
                .mockResolvedValueOnce(30)  // kycPending
                .mockResolvedValueOnce(5)   // highRisk
                .mockResolvedValueOnce(12)  // newThisMonth
                .mockResolvedValueOnce(45)  // activeProjectCustomers

            const stats = await customerService.getStats()

            expect(stats.totalCustomers).toBe(100)
            expect(stats.kycApproved).toBe(60)
            expect(stats.kycPending).toBe(30)
            expect(stats.highRisk).toBe(5)
            expect(stats.newThisMonth).toBe(12)
            expect(stats.activeProjectCustomers).toBe(45)
        })
    })

    describe('autoAssignTags', () => {
        it('应该基于客户总消费为其自动分配正确的价值标签', async () => {
            const mockCustomerData = {
                id: 'c1',
                projects: [
                    {
                        projectType: 'company_registration',
                        invoices: [{ paidAmount: 40000 }, { paidAmount: 15000 }] // Total 55000
                    }
                ],
                lead: {
                    serviceTypes: ['vcc_fund'],
                    sourceChannel: 'Google Ads'
                }
            }

            prismaMock.customer.findUnique.mockResolvedValue(mockCustomerData)
            prismaMock.customer.update.mockResolvedValue({})

            const tags = await customerService.autoAssignTags('c1')

            // 55000 应该获得 VIP客户 标签
            expect(tags).toContain('VIP客户')
            expect(tags).toContain('已购:公司注册')
            expect(tags).toContain('意向:VCC基金')
            expect(tags).toContain('来源:Google Ads')
            expect(prismaMock.customer.update).toHaveBeenCalled()
        })
    })
})
