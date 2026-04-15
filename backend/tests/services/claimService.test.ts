import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1. 提升 mock 对象
const prismaMock = vi.hoisted(() => ({
    claim: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
    },
    claimItem: {
        create: vi.fn(),
        delete: vi.fn(),
        aggregate: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
    },
    $transaction: vi.fn((fnOrCmds: unknown) => {
        // 支持回调式事务
        if (typeof fnOrCmds === 'function') {
            return fnOrCmds({
                claim: { findFirst: prismaMock.claim.findFirst, update: prismaMock.claim.update },
                claimItem: { create: prismaMock.claimItem.create, aggregate: prismaMock.claimItem.aggregate },
            })
        }
        return Promise.all(fnOrCmds as unknown[])
    }),
}))

// 2. Mock 模块
vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

// 3. 导入被测模块
import { claimService } from '../../src/services/claimService'

describe('ClaimService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ==================== 报销单号生成 ====================

    describe('generateClaimNumber', () => {
        it('应生成正确格式的报销单号', async () => {
            // findFirst 返回最后一个单号
            prismaMock.claim.findFirst.mockResolvedValue({
                claimNumber: 'CLM-20260312-005',
            })

            const result = await claimService.generateClaimNumber()

            // 格式: CLM-YYYYMMDD-NNN
            expect(result).toMatch(/^CLM-\d{8}-\d{3}$/)
        })

        it('当天无报销单时应从 001 开始', async () => {
            prismaMock.claim.findFirst.mockResolvedValue(null)

            const result = await claimService.generateClaimNumber()

            expect(result).toMatch(/^CLM-\d{8}-001$/)
        })
    })

    // ==================== 列表查询 ====================

    describe('getClaimList', () => {
        it('应返回报销单列表和分页', async () => {
            const mockClaims = [
                { id: 'c-1', claimNumber: 'CLM-20260312-001', status: 'DRAFT' },
            ]
            prismaMock.claim.findMany.mockResolvedValue(mockClaims)
            prismaMock.claim.count.mockResolvedValue(1)

            const result = await claimService.getClaimList(
                {},
                { page: 1, limit: 10 },
            )

            expect(result.data).toHaveLength(1)
            expect(result.pagination.total).toBe(1)
        })

        it('应支持按状态筛选', async () => {
            prismaMock.claim.findMany.mockResolvedValue([])
            prismaMock.claim.count.mockResolvedValue(0)

            await claimService.getClaimList(
                { status: 'SUBMITTED' as any },
                { page: 1, limit: 10 },
            )

            expect(prismaMock.claim.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ status: 'SUBMITTED' }),
                })
            )
        })
    })

    // ==================== 创建报销单 ====================

    describe('createClaim', () => {
        it('应创建草稿报销单', async () => {
            prismaMock.claim.findFirst.mockResolvedValue(null) // generateClaimNumber
            prismaMock.claim.create.mockResolvedValue({
                id: 'c-new',
                claimNumber: 'CLM-20260312-001',
                status: 'DRAFT',
                totalAmount: 0,
                items: [],
            })

            const result = await claimService.createClaim(
                { title: '3月出差报销', currency: 'SGD' },
                'user-1',
            )

            expect(result.status).toBe('DRAFT')
            expect(prismaMock.claim.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        title: '3月出差报销',
                        submitterId: 'user-1',
                    }),
                })
            )
        })
    })

    // ==================== 添加明细 ====================

    describe('addClaimItem', () => {
        it('应添加明细并更新总金额', async () => {
            prismaMock.claim.findFirst.mockResolvedValue({
                id: 'c-1',
                status: 'DRAFT',
                submitterId: 'user-1',
            })
            prismaMock.claimItem.create.mockResolvedValue({
                id: 'ci-1',
                claimId: 'c-1',
                amount: 100,
            })
            prismaMock.claimItem.aggregate.mockResolvedValue({
                _sum: { amount: 100 },
            })
            prismaMock.claim.update.mockResolvedValue({
                id: 'c-1',
                totalAmount: 100,
            })

            const result = await claimService.addClaimItem('c-1', {
                category: 'TRANSPORT',
                description: '出租车费用',
                amount: 100,
                expenseDate: '2026-03-01',
            }, 'user-1')

            expect(result.id).toBe('ci-1')
        })

        it('非草稿状态应拒绝添加', async () => {
            prismaMock.claim.findFirst.mockResolvedValue({
                id: 'c-1',
                status: 'SUBMITTED',
                submitterId: 'user-1',
            })

            await expect(claimService.addClaimItem('c-1', {
                category: 'MEAL',
                description: '午餐',
                amount: 30,
                expenseDate: '2026-03-01',
            }, 'user-1')).rejects.toThrow()
        })
    })

    // ==================== 提交审批 ====================

    describe('submitClaim', () => {
        it('应将草稿报销单提交为待审批', async () => {
            prismaMock.claim.findFirst.mockResolvedValue({
                id: 'c-1',
                status: 'DRAFT',
                submitterId: 'user-1',
                totalAmount: 500,
                items: [{ id: 'ci-1' }],
            })
            prismaMock.claim.update.mockResolvedValue({
                id: 'c-1',
                status: 'SUBMITTED',
            })

            const result = await claimService.submitClaim('c-1', 'user-1')

            expect(result.status).toBe('SUBMITTED')
        })

        it('无明细时应拒绝提交', async () => {
            prismaMock.claim.findFirst.mockResolvedValue({
                id: 'c-1',
                status: 'DRAFT',
                submitterId: 'user-1',
                totalAmount: 0,
                items: [],
            })

            await expect(claimService.submitClaim('c-1', 'user-1'))
                .rejects.toThrow()
        })
    })

    // ==================== 审批 ====================

    describe('approveClaim', () => {
        it('Admin 应批准已提交的报销单', async () => {
            prismaMock.claim.findFirst.mockResolvedValue({
                id: 'c-1',
                status: 'SUBMITTED',
            })
            prismaMock.claim.update.mockResolvedValue({
                id: 'c-1',
                status: 'APPROVED',
            })

            const result = await claimService.approveClaim('c-1', 'admin-1', undefined, true)

            expect(result.status).toBe('APPROVED')
        })

        it('Manager 应将 SUBMITTED 变为 MANAGER_APPROVED', async () => {
            prismaMock.claim.findFirst.mockResolvedValue({
                id: 'c-1',
                status: 'SUBMITTED',
            })
            prismaMock.claim.update.mockResolvedValue({
                id: 'c-1',
                status: 'MANAGER_APPROVED',
            })

            const result = await claimService.approveClaim('c-1', 'manager-1', undefined, false)

            expect(result.status).toBe('MANAGER_APPROVED')
        })
    })

    // ==================== 驳回 ====================

    describe('rejectClaim', () => {
        it('应驳回报销单并记录原因', async () => {
            prismaMock.claim.findFirst.mockResolvedValue({
                id: 'c-1',
                status: 'SUBMITTED',
            })
            prismaMock.claim.update.mockResolvedValue({
                id: 'c-1',
                status: 'REJECTED',
                rejectionReason: '金额超标',
            })

            const result = await claimService.rejectClaim('c-1', 'manager-1', '金额超标')

            expect(result.status).toBe('REJECTED')
        })
    })

    // ==================== 统计 ====================

    describe('getClaimStats', () => {
        it('应返回报销统计数据', async () => {
            prismaMock.claim.count
                .mockResolvedValueOnce(20) // total
                .mockResolvedValueOnce(5)  // pending
                .mockResolvedValueOnce(10) // approved
                .mockResolvedValueOnce(8)  // paid
            prismaMock.claim.aggregate.mockResolvedValue({
                _sum: { totalAmount: 50000 },
            })

            const result = await claimService.getClaimStats()

            expect(result.total).toBe(20)
            expect(result.pending).toBe(5)
            expect(result.approved).toBe(10)
            expect(result.paid).toBe(8)
        })
    })
})
