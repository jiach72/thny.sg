import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock } from '../prismaMock'

// Mock PrismaClient
vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn(() => prismaMock),
}))

// 需要在 mock 之后动态导入
const { rbacService } = await import('../../src/services/rbacService')

describe('RBACService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // 清除缓存确保每个测试隔离
        rbacService.clearCache()
    })

    describe('hasPermission', () => {
        it('ADMIN 角色应直接返回 true（超级权限兜底）', async () => {
            const result = await rbacService.hasPermission('ADMIN', 'any:action')
            expect(result).toBe(true)
            // 不应查询数据库
            expect(prismaMock.role.findUnique).not.toHaveBeenCalled()
        })

        it('拥有权限的角色应返回 true', async () => {
            prismaMock.role.findUnique.mockResolvedValue({
                id: 'role-1',
                code: 'SALES',
                name: '销售',
                description: null,
                isSystem: true,
                createdAt: new Date(),
                permissions: [
                    { permission: { code: 'leads:create' } },
                    { permission: { code: 'leads:read' } },
                ],
            } as any)

            const result = await rbacService.hasPermission('SALES', 'leads:create')
            expect(result).toBe(true)
        })

        it('缺少权限的角色应返回 false', async () => {
            prismaMock.role.findUnique.mockResolvedValue({
                id: 'role-1',
                code: 'SALES',
                name: '销售',
                description: null,
                isSystem: true,
                createdAt: new Date(),
                permissions: [
                    { permission: { code: 'leads:read' } },
                ],
            } as any)

            const result = await rbacService.hasPermission('SALES', 'leads:delete')
            expect(result).toBe(false)
        })

        it('不存在的角色应返回 false', async () => {
            prismaMock.role.findUnique.mockResolvedValue(null)

            const result = await rbacService.hasPermission('UNKNOWN', 'leads:create')
            expect(result).toBe(false)
        })

        it('缓存命中时不应重复查询数据库', async () => {
            prismaMock.role.findUnique.mockResolvedValue({
                id: 'role-1',
                code: 'SALES',
                name: '销售',
                description: null,
                isSystem: true,
                createdAt: new Date(),
                permissions: [
                    { permission: { code: 'leads:read' } },
                ],
            } as any)

            // 第一次调用 - 查询数据库
            await rbacService.hasPermission('SALES', 'leads:read')
            // 第二次调用 - 应使用缓存
            await rbacService.hasPermission('SALES', 'leads:read')

            expect(prismaMock.role.findUnique).toHaveBeenCalledTimes(1)
        })
    })

    describe('deleteRole', () => {
        it('系统角色不可删除', async () => {
            prismaMock.role.findUnique.mockResolvedValue({
                id: 'role-1',
                code: 'ADMIN',
                name: '管理员',
                isSystem: true,
                createdAt: new Date(),
            } as any)

            const result = await rbacService.deleteRole('ADMIN')
            expect(result).toBe(false)
            expect(prismaMock.role.delete).not.toHaveBeenCalled()
        })

        it('不存在的角色返回 false', async () => {
            prismaMock.role.findUnique.mockResolvedValue(null)

            const result = await rbacService.deleteRole('NONEXIST')
            expect(result).toBe(false)
        })

        it('非系统角色可以删除', async () => {
            prismaMock.role.findUnique.mockResolvedValue({
                id: 'role-custom',
                code: 'CUSTOM',
                name: '自定义角色',
                isSystem: false,
                createdAt: new Date(),
            } as any)
            prismaMock.role.delete.mockResolvedValue({} as any)

            const result = await rbacService.deleteRole('CUSTOM')
            expect(result).toBe(true)
            expect(prismaMock.role.delete).toHaveBeenCalledWith({
                where: { code: 'CUSTOM' },
            })
        })
    })

    describe('clearCache', () => {
        it('清除指定角色的缓存', async () => {
            prismaMock.role.findUnique.mockResolvedValue({
                id: 'role-1',
                code: 'SALES',
                name: '销售',
                description: null,
                isSystem: true,
                createdAt: new Date(),
                permissions: [{ permission: { code: 'leads:read' } }],
            } as any)

            // 加载缓存
            await rbacService.hasPermission('SALES', 'leads:read')
            expect(prismaMock.role.findUnique).toHaveBeenCalledTimes(1)

            // 清除缓存
            rbacService.clearCache('SALES')

            // 应重新查询
            await rbacService.hasPermission('SALES', 'leads:read')
            expect(prismaMock.role.findUnique).toHaveBeenCalledTimes(2)
        })
    })
})
