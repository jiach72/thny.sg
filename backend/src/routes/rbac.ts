import { Router } from 'express'
import { authMiddleware, requireRole } from '../middlewares/auth.js'
import { rbacService } from '../services/rbacService.js'

const router = Router()

// 所有 RBAC 路由需要认证，且仅 ADMIN 可访问
router.use(authMiddleware)
router.use(requireRole('ADMIN'))

/**
 * 获取所有角色
 * GET /api/v1/rbac/roles
 */
router.get('/roles', async (req, res) => {
    try {
        const roles = await rbacService.getAllRoles()
        res.json({ success: true, data: roles })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

/**
 * 创建新角色
 * POST /api/v1/rbac/roles
 */
router.post('/roles', async (req, res) => {
    try {
        const { code, name, description } = req.body

        if (!code || !name) {
            return res.status(400).json({
                success: false,
                message: '角色代码和名称为必填项'
            })
        }

        const role = await rbacService.createRole({ code, name, description })
        res.status(201).json({ success: true, data: role })
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: '角色代码已存在'
            })
        }
        res.status(500).json({ success: false, message: error.message })
    }
})

/**
 * 删除角色
 * DELETE /api/v1/rbac/roles/:roleCode
 */
router.delete('/roles/:roleCode', async (req, res) => {
    try {
        const { roleCode } = req.params
        const deleted = await rbacService.deleteRole(roleCode)

        if (!deleted) {
            return res.status(400).json({
                success: false,
                message: '无法删除系统内置角色或角色不存在'
            })
        }

        res.json({ success: true, message: '角色已删除' })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

/**
 * 获取所有权限
 * GET /api/v1/rbac/permissions
 */
router.get('/permissions', async (req, res) => {
    try {
        const permissions = await rbacService.getAllPermissions()
        res.json({ success: true, data: permissions })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

/**
 * 按资源分组获取权限
 * GET /api/v1/rbac/permissions/grouped
 */
router.get('/permissions/grouped', async (req, res) => {
    try {
        const grouped = await rbacService.getPermissionsGroupedByResource()
        res.json({ success: true, data: grouped })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

/**
 * 获取角色的权限列表
 * GET /api/v1/rbac/roles/:roleCode/permissions
 */
router.get('/roles/:roleCode/permissions', async (req, res) => {
    try {
        const { roleCode } = req.params
        const permissions = await rbacService.getRolePermissions(roleCode)
        res.json({ success: true, data: permissions })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

/**
 * 更新角色权限 (接收 permissionCodes 数组)
 * PUT /api/v1/rbac/roles/:roleCode/permissions
 * Body: { permissionCodes: ["leads:create", "leads:read", ...] }
 */
router.put('/roles/:roleCode/permissions', async (req, res) => {
    try {
        const { roleCode } = req.params
        const { permissionCodes } = req.body

        if (!Array.isArray(permissionCodes)) {
            return res.status(400).json({
                success: false,
                message: 'permissionCodes 必须是数组'
            })
        }

        await rbacService.setRolePermissions(roleCode, permissionCodes)
        res.json({ success: true, message: '权限已更新' })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
