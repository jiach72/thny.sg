import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Decimal } from '@prisma/client/runtime/library'

// 1. 提升 mock 对象
const prismaMock = vi.hoisted(() => ({
    invoice: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
        aggregate: vi.fn(),
    },
    payment: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    $transaction: vi.fn((cmds: unknown[]) => Promise.all(cmds)),
}))

// 2. Mock 模块
vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

// 3. 导入被测模块
import { invoiceService } from '../../src/services/invoiceService'

describe('InvoiceService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ==================== 发票号生成 ====================

    describe('generateInvoiceNumber', () => {
        it('应生成正确格式的发票号', async () => {
            prismaMock.invoice.count.mockResolvedValue(5)

            const result = await invoiceService.generateInvoiceNumber()

            expect(result).toMatch(/^INV-\d{6}-0006$/)
            expect(prismaMock.invoice.count).toHaveBeenCalled()
        })

        it('当月无发票时应从 0001 开始', async () => {
            prismaMock.invoice.count.mockResolvedValue(0)

            const result = await invoiceService.generateInvoiceNumber()

            expect(result).toMatch(/^INV-\d{6}-0001$/)
        })
    })

    // ==================== 发票 CRUD ====================

    describe('getInvoices', () => {
        it('应返回发票列表和分页信息', async () => {
            const mockInvoices = [
                { id: 'inv-1', title: '测试发票', status: 'DRAFT' },
            ]
            prismaMock.invoice.findMany.mockResolvedValue(mockInvoices)
            prismaMock.invoice.count.mockResolvedValue(1)

            const result = await invoiceService.getInvoices({}, { page: 1, limit: 10 })

            expect(result.data).toHaveLength(1)
            expect(result.pagination.total).toBe(1)
            expect(result.pagination.totalPages).toBe(1)
        })

        it('应支持按状态筛选', async () => {
            prismaMock.invoice.findMany.mockResolvedValue([])
            prismaMock.invoice.count.mockResolvedValue(0)

            await invoiceService.getInvoices({ status: 'PAID' }, { page: 1, limit: 10 })

            expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: 'PAID' },
                })
            )
        })
    })

    describe('getInvoiceById', () => {
        it('应返回发票详情含关联数据', async () => {
            const mockInvoice = {
                id: 'inv-1',
                title: '测试发票',
                payments: [],
                project: { id: 'proj-1', title: '项目' },
            }
            prismaMock.invoice.findUnique.mockResolvedValue(mockInvoice)

            const result = await invoiceService.getInvoiceById('inv-1')

            expect(result?.id).toBe('inv-1')
            expect(prismaMock.invoice.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'inv-1' } })
            )
        })
    })

    describe('createInvoice', () => {
        it('应正确计算金额并创建发票', async () => {
            prismaMock.invoice.count.mockResolvedValue(0)
            prismaMock.invoice.create.mockResolvedValue({
                id: 'inv-new',
                invoiceNumber: 'INV-202602-0001',
                totalAmount: new Decimal(1100),
            })

            await invoiceService.createInvoice({
                projectId: 'proj-1',
                customerId: 'cust-1',
                title: '测试发票',
                items: [
                    { description: '服务A', quantity: 1, unitPrice: 1000, amount: 1000 },
                ],
                taxRate: 0.1,
                issueDate: '2026-02-01',
                dueDate: '2026-03-01',
            }, 'user-1')

            expect(prismaMock.invoice.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        subtotal: new Decimal(1000),
                        taxRate: new Decimal(0.1),
                        taxAmount: new Decimal(100),
                        totalAmount: new Decimal(1100),
                        currency: 'SGD',
                        createdById: 'user-1',
                    }),
                })
            )
        })
    })

    // ==================== 删除保护 ====================

    describe('deleteInvoice', () => {
        it('有收款记录时应拒绝删除', async () => {
            prismaMock.payment.count.mockResolvedValue(2)

            await expect(invoiceService.deleteInvoice('inv-1'))
                .rejects.toThrow('无法删除已有收款记录的发票')
        })

        it('无收款记录时应成功删除', async () => {
            prismaMock.payment.count.mockResolvedValue(0)
            prismaMock.invoice.delete.mockResolvedValue({ id: 'inv-1' })

            const result = await invoiceService.deleteInvoice('inv-1')
            expect(result.id).toBe('inv-1')
        })
    })

    // ==================== 状态变更 ====================

    describe('sendInvoice', () => {
        it('应将发票状态更新为 SENT', async () => {
            prismaMock.invoice.update.mockResolvedValue({ id: 'inv-1', status: 'SENT' })

            const result = await invoiceService.sendInvoice('inv-1')

            expect(result.status).toBe('SENT')
            expect(prismaMock.invoice.update).toHaveBeenCalledWith({
                where: { id: 'inv-1' },
                data: { status: 'SENT' },
            })
        })
    })

    describe('cancelInvoice', () => {
        it('应将发票状态更新为 CANCELLED', async () => {
            prismaMock.invoice.update.mockResolvedValue({ id: 'inv-1', status: 'CANCELLED' })

            const result = await invoiceService.cancelInvoice('inv-1')
            expect(result.status).toBe('CANCELLED')
        })
    })

    // ==================== 收款 ====================

    describe('recordPayment', () => {
        it('发票不存在时应抛出错误', async () => {
            prismaMock.invoice.findUnique.mockResolvedValue(null)

            await expect(invoiceService.recordPayment({
                invoiceId: 'inv-999',
                amount: 100,
                paymentMethod: 'bank_transfer',
                paymentDate: '2026-02-01',
            })).rejects.toThrow('发票不存在')
        })

        it('发票已取消时应拒绝收款', async () => {
            prismaMock.invoice.findUnique.mockResolvedValue({
                id: 'inv-1',
                status: 'CANCELLED',
                payments: [],
            })

            await expect(invoiceService.recordPayment({
                invoiceId: 'inv-1',
                amount: 100,
                paymentMethod: 'bank_transfer',
                paymentDate: '2026-02-01',
            })).rejects.toThrow('无法为已取消的发票记录收款')
        })

        it('发票已全额付款时应拒绝', async () => {
            prismaMock.invoice.findUnique.mockResolvedValue({
                id: 'inv-1',
                status: 'PAID',
                payments: [],
            })

            await expect(invoiceService.recordPayment({
                invoiceId: 'inv-1',
                amount: 100,
                paymentMethod: 'cash',
                paymentDate: '2026-02-01',
            })).rejects.toThrow('发票已全额付款')
        })

        it('全额付款时应将状态更新为 PAID', async () => {
            prismaMock.invoice.findUnique.mockResolvedValue({
                id: 'inv-1',
                status: 'SENT',
                totalAmount: new Decimal(1000),
                paidAmount: new Decimal(0),
                currency: 'SGD',
                payments: [],
            })
            prismaMock.payment.create.mockResolvedValue({ id: 'pay-1' })
            prismaMock.invoice.update.mockResolvedValue({ id: 'inv-1', status: 'PAID' })

            await invoiceService.recordPayment({
                invoiceId: 'inv-1',
                amount: 1000,
                paymentMethod: 'bank_transfer',
                paymentDate: '2026-02-01',
            })

            expect(prismaMock.invoice.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ status: 'PAID' }),
                })
            )
        })

        it('部分付款时应将状态更新为 PARTIAL', async () => {
            prismaMock.invoice.findUnique.mockResolvedValue({
                id: 'inv-1',
                status: 'SENT',
                totalAmount: new Decimal(1000),
                paidAmount: new Decimal(0),
                currency: 'SGD',
                payments: [],
            })
            prismaMock.payment.create.mockResolvedValue({ id: 'pay-1' })
            prismaMock.invoice.update.mockResolvedValue({ id: 'inv-1', status: 'PARTIAL' })

            await invoiceService.recordPayment({
                invoiceId: 'inv-1',
                amount: 500,
                paymentMethod: 'bank_transfer',
                paymentDate: '2026-02-01',
            })

            expect(prismaMock.invoice.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ status: 'PARTIAL' }),
                })
            )
        })
    })

    // ==================== 删除收款 ====================

    describe('deletePayment', () => {
        it('收款记录不存在时应抛出错误', async () => {
            prismaMock.payment.findUnique.mockResolvedValue(null)

            await expect(invoiceService.deletePayment('pay-999'))
                .rejects.toThrow('收款记录不存在')
        })
    })

    // ==================== 统计 ====================

    describe('getInvoiceStats', () => {
        it('应返回正确的统计数据', async () => {
            prismaMock.invoice.count.mockResolvedValue(10)
            prismaMock.invoice.groupBy.mockResolvedValue([
                { status: 'PAID', _count: 5, _sum: { totalAmount: new Decimal(5000) } },
                { status: 'SENT', _count: 5, _sum: { totalAmount: new Decimal(3000) } },
            ])
            prismaMock.invoice.aggregate
                .mockResolvedValueOnce({ _sum: { totalAmount: new Decimal(8000) } })
                .mockResolvedValueOnce({ _sum: { paidAmount: new Decimal(5000) } })

            const result = await invoiceService.getInvoiceStats()

            expect(result.totalInvoices).toBe(10)
            expect(result.totalAmount).toBe(8000)
            expect(result.paidAmount).toBe(5000)
            expect(result.outstandingAmount).toBe(3000)
        })
    })

    // ==================== 逾期检查 ====================

    describe('checkOverdueInvoices', () => {
        it('应将逾期发票状态更新为 OVERDUE', async () => {
            const overdueInvoices = [
                { id: 'inv-1' },
                { id: 'inv-2' },
            ]
            prismaMock.invoice.findMany.mockResolvedValue(overdueInvoices)
            prismaMock.invoice.updateMany.mockResolvedValue({ count: 2 })

            const result = await invoiceService.checkOverdueInvoices()

            expect(result.updated).toBe(2)
            expect(prismaMock.invoice.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: { in: ['inv-1', 'inv-2'] } },
                    data: { status: 'OVERDUE' },
                })
            )
        })

        it('无逾期发票时不执行更新', async () => {
            prismaMock.invoice.findMany.mockResolvedValue([])

            const result = await invoiceService.checkOverdueInvoices()

            expect(result.updated).toBe(0)
            expect(prismaMock.invoice.updateMany).not.toHaveBeenCalled()
        })
    })
})
