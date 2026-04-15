import { prisma } from '../config/index.js'
import { NotFoundError } from '../middlewares/index.js'

/**
 * RBAC 服务
 * 负责权限检查、角色管理、权限管理
 */
class RBACService {
    /** 缓存 TTL: 5 分钟（毫秒） */
    private static readonly CACHE_TTL_MS = 5 * 60 * 1000

    /** 内存缓存: roleCode -> { permissions, loadedAt } */
    private cache = new Map<string, { permissions: Set<string>; loadedAt: number }>()

    /**
     * 检查角色是否拥有某权限
     */
    async hasPermission(roleCode: string, permissionCode: string): Promise<boolean> {
        // ADMIN 超级权限兜底 (防止死锁)
        if (roleCode === 'ADMIN') return true

        // 从缓存读取，过期则重新加载
        const cached = this.cache.get(roleCode)
        const isExpired = cached && (Date.now() - cached.loadedAt > RBACService.CACHE_TTL_MS)
        if (!cached || isExpired) {
            await this.loadRolePermissions(roleCode)
        }

        return this.cache.get(roleCode)?.permissions.has(permissionCode) ?? false
    }

    /**
     * 加载角色权限到缓存
     */
    private async loadRolePermissions(roleCode: string): Promise<void> {
        const role = await prisma.role.findUnique({
            where: { code: roleCode },
            include: {
                permissions: {
                    include: { permission: true }
                }
            }
        })

        if (!role) {
            this.cache.set(roleCode, { permissions: new Set(), loadedAt: Date.now() })
            return
        }

        const permissionCodes = new Set<string>(
            role.permissions.map(rp => rp.permission.code)
        )
        this.cache.set(roleCode, { permissions: permissionCodes, loadedAt: Date.now() })
    }

    /**
     * 清除角色缓存 (权限更新后调用)
     */
    clearCache(roleCode?: string): void {
        if (roleCode) {
            this.cache.delete(roleCode)
        } else {
            this.cache.clear()
        }
    }

    /**
     * 获取所有角色
     */
    async getAllRoles() {
        return prisma.role.findMany({
            orderBy: { createdAt: 'asc' },
            include: {
                _count: { select: { users: true, permissions: true } }
            }
        })
    }

    /**
     * 创建新角色
     */
    async createRole(data: { code: string; name: string; description?: string }) {
        return prisma.role.create({
            data: {
                code: data.code.toUpperCase(),
                name: data.name,
                description: data.description,
                isSystem: false
            }
        })
    }

    /**
     * 删除角色 (系统角色不可删除)
     */
    async deleteRole(roleCode: string): Promise<boolean> {
        const role = await prisma.role.findUnique({ where: { code: roleCode } })
        if (!role || role.isSystem) return false

        await prisma.role.delete({ where: { code: roleCode } })
        this.clearCache(roleCode)
        return true
    }

    /**
     * 获取所有权限
     */
    async getAllPermissions() {
        return prisma.permission.findMany({
            orderBy: [{ resource: 'asc' }, { action: 'asc' }]
        })
    }

    /**
     * 按资源分组获取权限
     */
    async getPermissionsGroupedByResource() {
        const permissions = await this.getAllPermissions()
        const grouped: Record<string, typeof permissions> = {}

        for (const p of permissions) {
            if (!grouped[p.resource]) {
                grouped[p.resource] = []
            }
            grouped[p.resource].push(p)
        }

        return grouped
    }

    /**
     * 获取角色的权限列表
     */
    async getRolePermissions(roleCode: string): Promise<string[]> {
        const role = await prisma.role.findUnique({
            where: { code: roleCode },
            include: {
                permissions: {
                    include: { permission: true }
                }
            }
        })

        if (!role) return []
        return role.permissions.map(rp => rp.permission.code)
    }

    /**
     * 更新角色权限 (接收 permissionCodes 数组)
     */
    async setRolePermissions(roleCode: string, permissionCodes: string[]): Promise<void> {
        const role = await prisma.role.findUnique({ where: { code: roleCode } })
        if (!role) throw new NotFoundError(`角色 ${roleCode} 不存在`)

        // 查找对应的 Permission IDs
        const permissions = await prisma.permission.findMany({
            where: { code: { in: permissionCodes } }
        })

        // 删除现有关联
        await prisma.rolePermission.deleteMany({
            where: { roleId: role.id }
        })

        // 创建新关联
        if (permissions.length > 0) {
            await prisma.rolePermission.createMany({
                data: permissions.map(p => ({
                    roleId: role.id,
                    permissionId: p.id
                }))
            })
        }

        // 清除缓存
        this.clearCache(roleCode)
    }

    /**
     * 获取用户的所有权限 (用于前端)
     */
    async getUserPermissions(userId: string): Promise<string[]> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: { permission: true }
                        }
                    }
                }
            }
        })

        if (!user) return []

        // ADMIN 返回特殊标记
        if (user.role.code === 'ADMIN') {
            return ['*'] // 表示拥有所有权限
        }

        return user.role.permissions.map(rp => rp.permission.code)
    }
}

export const rbacService = new RBACService()
