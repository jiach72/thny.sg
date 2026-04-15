import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    lead: {
        findMany: vi.fn(),
    },
    invoice: {
        findMany: vi.fn(),
    },
    auditLog: {
        findMany: vi.fn(),
    },
    customer: {
        findFirst: vi.fn(),
    },
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

import { exportService } from '../../src/services/exportService'

describe('ExportService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('exportLeads', () => {
        it('should export leads to Excel buffer', async () => {
            const mockLeads = [
                {
                    id: 'lead-1',
                    contactName: '张三',
                    companyName: 'ABC公司',
                    email: 'zhangsan@example.com',
                    phone: '+65-12345678',
                    country: 'SG',
                    status: 'NEW',
                    score: 85,
                    sourceChannel: 'WEBSITE',
                    assignedTo: { name: '销售员A' },
                    tags: ['VIP', '热线索'],
                    createdAt: new Date('2026-01-15'),
                    deletedAt: null,
                },
            ]
            prismaMock.lead.findMany.mockResolvedValue(mockLeads as any)

            const result = await exportService.exportLeads()

            expect(result).toBeInstanceOf(Buffer)
            expect(prismaMock.lead.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { deletedAt: null },
                    orderBy: { createdAt: 'desc' },
                })
            )
        })

        it('should filter leads by date range', async () => {
            prismaMock.lead.findMany.mockResolvedValue([])

            await exportService.exportLeads({
                startDate: '2026-01-01',
                endDate: '2026-01-31',
            })

            expect(prismaMock.lead.findMany).toHaveBeenCalledWith(
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
    })

    describe('exportInvoices', () => {
        it('should export invoices to Excel buffer', async () => {
            const mockInvoices = [
                {
                    id: 'inv-1',
                    invoiceNumber: 'INV-2026-001',
                    totalAmount: 5000,
                    currency: 'SGD',
                    status: 'PENDING',
                    issueDate: new Date('2026-02-01'),
                    dueDate: new Date('2026-03-01'),
                    project: {
                        title: 'EP申请项目',
                        customer: { lead: { contactName: '张三', companyName: 'ABC公司' } },
                    },
                    createdAt: new Date('2026-02-01'),
                    deletedAt: null,
                },
            ]
            prismaMock.invoice.findMany.mockResolvedValue(mockInvoices as any)

            const result = await exportService.exportInvoices()

            expect(result).toBeInstanceOf(Buffer)
            expect(prismaMock.invoice.findMany).toHaveBeenCalled()
        })
    })

    describe('exportAuditLogs', () => {
        it('should export audit logs to Excel buffer', async () => {
            const mockLogs = [
                {
                    id: 'log-1',
                    action: 'LOGIN',
                    resource: 'auth',
                    resourceId: 'user-1',
                    ipAddress: '192.168.1.1',
                    createdAt: new Date('2026-03-01T10:30:00Z'),
                    user: { name: '管理员', email: 'admin@thny.sg' },
                },
            ]
            prismaMock.auditLog.findMany.mockResolvedValue(mockLogs as any)

            const result = await exportService.exportAuditLogs()

            expect(result).toBeInstanceOf(Buffer)
            expect(prismaMock.auditLog.findMany).toHaveBeenCalled()
        })
    })

    describe('exportCustomerData', () => {
        it('should return empty workbook if no customer found', async () => {
            prismaMock.customer.findFirst.mockResolvedValue(null)

            const result = await exportService.exportCustomerData('user-no-customer')

            expect(result).toBeInstanceOf(Buffer)
        })

        it('should export customer data with invoices and logs', async () => {
            prismaMock.customer.findFirst.mockResolvedValue({ id: 'cust-1', userId: 'user-1' })
            prismaMock.invoice.findMany.mockResolvedValue([
                {
                    id: 'inv-1',
                    invoiceNumber: 'INV-001',
                    totalAmount: 3000,
                    currency: 'SGD',
                    status: 'PAID',
                    issueDate: new Date('2026-01-01'),
                    dueDate: new Date('2026-02-01'),
                    project: { title: '测试项目' },
                },
            ])
            prismaMock.auditLog.findMany.mockResolvedValue([
                {
                    action: 'LOGIN',
                    resource: 'auth',
                    ipAddress: '10.0.0.1',
                    createdAt: new Date('2026-01-01T08:00:00Z'),
                },
            ])

            const result = await exportService.exportCustomerData('user-1')

            expect(result).toBeInstanceOf(Buffer)
            expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { customerId: 'cust-1', deletedAt: null },
                })
            )
        })
    })

    describe('buildWorkbook', () => {
        it('should build a valid Excel workbook', async () => {
            const columns = [
                { header: '名称', key: 'name', width: 20 },
                { header: '值', key: 'value', width: 15 },
            ]
            const rows = [
                { name: '测试1', value: 100 },
                { name: '测试2', value: 200 },
            ]

            const result = await exportService.buildWorkbook(columns, rows, '测试工作表')

            expect(result).toBeInstanceOf(Buffer)
        })
    })
})
