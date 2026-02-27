import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import { PrismaClient } from '@prisma/client'
import { customerService } from '../../src/services/customerService.js'

// 劫持并注入 mock Prisma
vi.mock('../../src/config/index.js', () => ({
    prisma: mockDeep<PrismaClient>()
}))

import { prisma } from '../../src/config/index.js'

describe('customerService', () => {
    beforeEach(() => {
        mockReset(prisma)
    })

    describe('getCustomerList', () => {
        it('应该成功返回分页后的客户列表和元信息', async () => {
            const mockCustomers = [
                { id: 'c1', contactName: 'Alice', kycStatus: 'APPROVED' },
                { id: 'c2', contactName: 'Bob', kycStatus: 'PENDING' }
            ]
            vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as any)
            vi.mocked(prisma.customer.count).mockResolvedValue(2)

            const result = await customerService.getCustomerList({ page: 1, limit: 10, search: 'A' })

            expect(result.data).toHaveLength(2)
            expect(result.pagination.total).toBe(2)
            expect(result.pagination.totalPages).toBe(1)
            expect(prisma.customer.findMany).toHaveBeenCalledTimes(1)
            expect(prisma.customer.count).toHaveBeenCalledTimes(1)
        })
    })

    describe('getStats', () => {
        it('应该聚合各维度的统计数据', async () => {
            // mockMultiple calls
            vi.mocked(prisma.customer.count)
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

            vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomerData as any)
            vi.mocked(prisma.customer.update).mockResolvedValue({} as any)

            const tags = await customerService.autoAssignTags('c1')

            // 55000 应该获得 VIP客户 标签
            expect(tags).toContain('VIP客户')
            expect(tags).toContain('已购:公司注册')
            expect(tags).toContain('意向:VCC基金')
            expect(tags).toContain('来源:Google Ads')
            expect(prisma.customer.update).toHaveBeenCalled()
        })
    })
})
