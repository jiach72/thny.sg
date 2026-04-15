import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1. Hoist mock 对象
const prismaMock = vi.hoisted(() => ({
    inquiry: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
}))

// 2. Mock 模块
vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

// 3. 在 mock 之后导入服务
import { inquiryService } from '../../src/services/inquiryService'

describe('inquiryService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getInquiries', () => {
        it('应该返回分页后的咨询列表', async () => {
            const mockInquiries = [
                { id: 'inq-1', name: 'Alice', message: '咨询1', status: 'NEW' },
                { id: 'inq-2', name: 'Bob', message: '咨询2', status: 'PROCESSED' },
            ]

            prismaMock.inquiry.findMany.mockResolvedValue(mockInquiries as any)
            prismaMock.inquiry.count.mockResolvedValue(2)

            const result = await inquiryService.getInquiries(undefined, { page: 1, limit: 10 })

            expect(result.data).toHaveLength(2)
            expect(result.pagination.total).toBe(2)
            expect(result.pagination.totalPages).toBe(1)
            expect(result.pagination.page).toBe(1)
            expect(result.pagination.limit).toBe(10)
        })

        it('应该按状态过滤咨询列表', async () => {
            prismaMock.inquiry.findMany.mockResolvedValue([] as any)
            prismaMock.inquiry.count.mockResolvedValue(0)

            await inquiryService.getInquiries('NEW', { page: 1, limit: 10 })

            expect(prismaMock.inquiry.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: 'NEW' },
                })
            )
            expect(prismaMock.inquiry.count).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ status: 'NEW' }),
                })
            )
        })

        it('应该正确计算分页偏移量', async () => {
            prismaMock.inquiry.findMany.mockResolvedValue([] as any)
            prismaMock.inquiry.count.mockResolvedValue(25)

            const result = await inquiryService.getInquiries(undefined, { page: 3, limit: 10 })

            expect(result.pagination.totalPages).toBe(3) // Math.ceil(25/10) = 3
            expect(prismaMock.inquiry.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 20, // (3-1) * 10
                    take: 10,
                })
            )
        })
    })

    describe('createInquiry', () => {
        it('应该成功创建咨询', async () => {
            const inputData = {
                name: 'Charlie',
                email: 'charlie@example.com',
                phone: '+6512345678',
                message: '我想了解公司注册服务',
                source: 'website',
            }
            const mockCreated = { id: 'inq-new', ...inputData, status: 'NEW' }

            prismaMock.inquiry.create.mockResolvedValue(mockCreated as any)

            const result = await inquiryService.createInquiry(inputData)

            expect(result.id).toBe('inq-new')
            expect(prismaMock.inquiry.create).toHaveBeenCalledWith({
                data: inputData,
            })
        })
    })

    describe('updateInquiry', () => {
        it('应该成功更新咨询状态', async () => {
            const existing = { id: 'inq-1', status: 'NEW' }
            const updated = { id: 'inq-1', status: 'PROCESSED', processedLeadId: 'lead-1' }

            prismaMock.inquiry.findUnique.mockResolvedValue(existing as any)
            prismaMock.inquiry.update.mockResolvedValue(updated as any)

            const result = await inquiryService.updateInquiry('inq-1', {
                status: 'PROCESSED',
                processedLeadId: 'lead-1',
            })

            expect(result.status).toBe('PROCESSED')
            expect(prismaMock.inquiry.update).toHaveBeenCalledWith({
                where: { id: 'inq-1' },
                data: { status: 'PROCESSED', processedLeadId: 'lead-1' },
            })
        })

        it('应该在咨询不存在时抛出 NotFoundError', async () => {
            prismaMock.inquiry.findUnique.mockResolvedValue(null)

            await expect(
                inquiryService.updateInquiry('nonexistent', { status: 'PROCESSED' })
            ).rejects.toThrow('咨询不存在')
        })
    })

    describe('deleteInquiry', () => {
        it('应该成功删除咨询', async () => {
            const existing = { id: 'inq-1', name: 'Test' }

            prismaMock.inquiry.findUnique.mockResolvedValue(existing as any)
            prismaMock.inquiry.delete.mockResolvedValue(existing as any)

            const result = await inquiryService.deleteInquiry('inq-1')

            expect(result.success).toBe(true)
            expect(prismaMock.inquiry.delete).toHaveBeenCalledWith({
                where: { id: 'inq-1' },
            })
        })

        it('应该在咨询不存在时抛出 NotFoundError', async () => {
            prismaMock.inquiry.findUnique.mockResolvedValue(null)

            await expect(
                inquiryService.deleteInquiry('nonexistent')
            ).rejects.toThrow('咨询不存在')
        })
    })
})
