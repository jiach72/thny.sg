import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1. Hoist mock 对象 — 需要模拟事务内的 tx 对象
const txMock = vi.hoisted(() => ({
    user: {
        findUnique: vi.fn(),
        update: vi.fn(),
    },
    customer: {
        findUnique: vi.fn(),
        update: vi.fn(),
    },
    familyMember: {
        updateMany: vi.fn(),
    },
    project: {
        findMany: vi.fn(),
        updateMany: vi.fn(),
    },
    document: {
        updateMany: vi.fn(),
    },
    lead: {
        updateMany: vi.fn(),
    },
}))

const prismaMock = vi.hoisted(() => ({
    user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
    },
    customer: {
        findFirst: vi.fn(),
        update: vi.fn(),
    },
    $transaction: vi.fn(),
}))

const familyMemberRepoMock = vi.hoisted(() => ({
    findByCustomerId: vi.fn(),
    findByCustomerAndMemberId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
}))

// 2. Mock 模块
vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

vi.mock('../../src/repositories/FamilyMemberRepository.js', () => ({
    familyMemberRepository: familyMemberRepoMock,
}))

// 3. Mock bcryptjs
vi.mock('bcryptjs', () => ({
    default: {
        compare: vi.fn().mockResolvedValue(true),
        hash: vi.fn().mockResolvedValue('hashed-password'),
    },
    compare: vi.fn().mockResolvedValue(true),
    hash: vi.fn().mockResolvedValue('hashed-password'),
}))

// 4. 在 mock 之后导入服务
import { portalService } from '../../src/services/portalService'

describe('portalService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('deleteAccount', () => {
        it('应该成功注销活跃用户并匿名化个人数据', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                name: 'Test User',
                status: 'ACTIVE',
            }
            const mockCustomer = {
                id: 'customer-1',
                userId: 'user-1',
                contactName: 'Test Customer',
                email: 'customer@example.com',
            }

            // 模拟事务回调：将 txMock 作为事务上下文传入
            txMock.user.findUnique.mockResolvedValue(mockUser as any)
            txMock.customer.findUnique.mockResolvedValue(mockCustomer as any)
            txMock.familyMember.updateMany.mockResolvedValue({ count: 0 } as any)
            txMock.project.findMany.mockResolvedValue([] as any)
            txMock.customer.update.mockResolvedValue({} as any)
            txMock.user.update.mockResolvedValue({} as any)
            txMock.lead.updateMany.mockResolvedValue({ count: 0 } as any)

            prismaMock.$transaction.mockImplementation(async (cb) => cb(txMock))

            const result = await portalService.deleteAccount('user-1')

            expect(result.success).toBe(true)
            expect(result.message).toBe('账户已删除，个人数据已匿名化')

            // 验证事务内：用户状态被设为 INACTIVE，个人信息被匿名化
            expect(txMock.user.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: expect.objectContaining({
                    status: 'INACTIVE',
                    name: '已删除用户',
                }),
            })

            // 验证事务内：客户信息被匿名化
            expect(txMock.customer.update).toHaveBeenCalledWith({
                where: { id: 'customer-1' },
                data: expect.objectContaining({
                    contactName: '已删除用户',
                    deletedAt: expect.any(Date),
                }),
            })

            // 验证事务内：解除该用户作为顾问的 Lead 分配
            expect(txMock.lead.updateMany).toHaveBeenCalledWith({
                where: { assignedToId: 'user-1' },
                data: { assignedToId: null },
            })
        })

        it('应该对没有关联客户的用户正常注销', async () => {
            const mockUser = {
                id: 'user-2',
                email: 'nocustomer@example.com',
                name: 'No Customer User',
                status: 'ACTIVE',
            }

            txMock.user.findUnique.mockResolvedValue(mockUser as any)
            txMock.customer.findUnique.mockResolvedValue(null)
            txMock.user.update.mockResolvedValue({} as any)
            txMock.lead.updateMany.mockResolvedValue({ count: 0 } as any)

            prismaMock.$transaction.mockImplementation(async (cb) => cb(txMock))

            const result = await portalService.deleteAccount('user-2')

            expect(result.success).toBe(true)
            // 无关联客户时，不应调用 customer.update / familyMember.updateMany
            expect(txMock.customer.update).not.toHaveBeenCalled()
            expect(txMock.familyMember.updateMany).not.toHaveBeenCalled()
        })

        it('应该在用户不存在时抛出 NotFoundError', async () => {
            txMock.user.findUnique.mockResolvedValue(null)
            prismaMock.$transaction.mockImplementation(async (cb) => cb(txMock))

            await expect(portalService.deleteAccount('nonexistent'))
                .rejects.toThrow('用户不存在')
        })

        it('应该在账户已注销时抛出 BusinessLogicError', async () => {
            const mockUser = {
                id: 'user-3',
                email: 'deleted@example.com',
                name: 'Deleted User',
                status: 'INACTIVE',
            }

            txMock.user.findUnique.mockResolvedValue(mockUser as any)
            prismaMock.$transaction.mockImplementation(async (cb) => cb(txMock))

            await expect(portalService.deleteAccount('user-3'))
                .rejects.toThrow('账户已注销')
        })
    })
})
