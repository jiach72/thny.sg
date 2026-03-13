import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1. 提升 mock 对象
const prismaMock = vi.hoisted(() => ({
    vendor: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
    },
    vendorAssignment: {
        create: vi.fn(),
        delete: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
    },
}))

// 2. Mock 模块
vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

// 3. 导入被测模块
import { vendorService } from '../../src/services/vendorService'

describe('VendorService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ==================== 列表查询 ====================

    describe('getVendorList', () => {
        it('应返回供应商列表和分页信息', async () => {
            const mockVendors = [
                { id: 'v-1', name: '法务事务所 A', type: 'LEGAL', status: 'ACTIVE' },
            ]
            prismaMock.vendor.findMany.mockResolvedValue(mockVendors)
            prismaMock.vendor.count.mockResolvedValue(1)

            const result = await vendorService.getVendorList({}, { page: 1, limit: 10 })

            expect(result.data).toHaveLength(1)
            expect(result.pagination.total).toBe(1)
            expect(prismaMock.vendor.findMany).toHaveBeenCalled()
        })

        it('应支持按类型筛选', async () => {
            prismaMock.vendor.findMany.mockResolvedValue([])
            prismaMock.vendor.count.mockResolvedValue(0)

            await vendorService.getVendorList({ type: 'LEGAL' as any }, { page: 1, limit: 10 })

            expect(prismaMock.vendor.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ type: 'LEGAL' }),
                })
            )
        })

        it('应支持关键词搜索', async () => {
            prismaMock.vendor.findMany.mockResolvedValue([])
            prismaMock.vendor.count.mockResolvedValue(0)

            await vendorService.getVendorList({ search: 'ABC' }, { page: 1, limit: 10 })

            expect(prismaMock.vendor.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.any(Array),
                    }),
                })
            )
        })
    })

    // ==================== 详情 ====================

    describe('getVendorById', () => {
        it('应返回供应商详情含项目分配', async () => {
            const mockVendor = {
                id: 'v-1',
                name: '法务事务所 A',
                assignments: [],
            }
            prismaMock.vendor.findFirst.mockResolvedValue(mockVendor)

            const result = await vendorService.getVendorById('v-1')

            expect(result?.id).toBe('v-1')
            expect(prismaMock.vendor.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'v-1', deletedAt: null } })
            )
        })

        it('供应商不存在时应抛出错误', async () => {
            prismaMock.vendor.findFirst.mockResolvedValue(null)

            await expect(vendorService.getVendorById('v-999'))
                .rejects.toThrow()
        })
    })

    // ==================== 创建 ====================

    describe('createVendor', () => {
        it('应成功创建供应商', async () => {
            const newVendor = {
                id: 'v-new',
                name: '新供应商',
                type: 'OTHER',
                status: 'ACTIVE',
            }
            prismaMock.vendor.create.mockResolvedValue(newVendor)

            const result = await vendorService.createVendor({
                name: '新供应商',
                type: 'OTHER' as any,
            })

            expect(result.id).toBe('v-new')
            expect(prismaMock.vendor.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        name: '新供应商',
                        type: 'OTHER',
                    }),
                })
            )
        })
    })

    // ==================== 更新 ====================

    describe('updateVendor', () => {
        it('应成功更新供应商信息', async () => {
            // getVendorById 先验证存在
            prismaMock.vendor.findFirst.mockResolvedValue({ id: 'v-1', name: '旧名称' })
            prismaMock.vendor.update.mockResolvedValue({
                id: 'v-1',
                name: '更新后的名称',
            })

            const result = await vendorService.updateVendor('v-1', { name: '更新后的名称' })

            expect(result.name).toBe('更新后的名称')
        })
    })

    // ==================== 软删除 ====================

    describe('deleteVendor', () => {
        it('应执行软删除', async () => {
            // getVendorById 先验证存在
            prismaMock.vendor.findFirst.mockResolvedValue({ id: 'v-1' })
            prismaMock.vendor.update.mockResolvedValue({ id: 'v-1', deletedAt: new Date() })

            await vendorService.deleteVendor('v-1')

            expect(prismaMock.vendor.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'v-1' },
                    data: expect.objectContaining({
                        deletedAt: expect.any(Date),
                    }),
                })
            )
        })
    })

    // ==================== 统计 ====================

    describe('getVendorStats', () => {
        it('应返回统计数据', async () => {
            prismaMock.vendor.count
                .mockResolvedValueOnce(10) // total
                .mockResolvedValueOnce(8)  // active
                .mockResolvedValueOnce(2)  // inactive
                .mockResolvedValueOnce(1)  // expiringContracts
            prismaMock.vendor.groupBy.mockResolvedValue([
                { type: 'LEGAL', _count: { id: 5 } },
                { type: 'ACCOUNTING', _count: { id: 3 } },
            ])

            const result = await vendorService.getVendorStats()

            expect(result.total).toBe(10)
            expect(result.active).toBe(8)
            expect(result.inactive).toBe(2)
        })
    })

    // ==================== 项目分配 ====================

    describe('assignToProject', () => {
        it('应创建供应商-项目分配', async () => {
            // getVendorById 先验证存在
            prismaMock.vendor.findFirst.mockResolvedValue({ id: 'v-1' })
            prismaMock.vendorAssignment.create.mockResolvedValue({
                id: 'va-1',
                vendorId: 'v-1',
                projectId: 'p-1',
                role: '法律顾问',
            })

            const result = await vendorService.assignToProject('v-1', {
                projectId: 'p-1',
                role: '法律顾问',
                fee: 5000,
            })

            expect(result.vendorId).toBe('v-1')
        })
    })
})
