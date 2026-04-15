import { Router, Request, Response, NextFunction } from 'express'
import { body, param } from 'express-validator'
import { authMiddleware, requireRole } from '../middlewares/auth.js'
import { validate } from '../middlewares/validation.js'
import { rbacService } from '../services/rbacService.js'
import { sendSuccess, sendError, success } from '../utils/responseHelper.js'

const router = Router()

// 所有 RBAC 路由需要认证，且仅 ADMIN 可访问
router.use(authMiddleware)
router.use(requireRole('ADMIN'))

/**
 * 获取所有角色
 * GET /api/v1/rbac/roles
 */
router.get('/roles', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const roles = await rbacService.getAllRoles()
        sendSuccess(res, roles)
    } catch (error) {
        next(error)
    }
})

/**
 * 创建新角色
 * POST /api/v1/rbac/roles
 */
router.post(
    '/roles',
    [
        body('code')
            .notEmpty().withMessage('角色代码不能为空')
            .isAlphanumeric().withMessage('角色代码只能包含字母和数字')
            .isLength({ max: 32 }).withMessage('角色代码最长 32 个字符'),
        body('name')
            .notEmpty().withMessage('角色名称不能为空')
            .isLength({ max: 64 }).withMessage('角色名称最长 64 个字符'),
        body('description')
            .optional()
            .isLength({ max: 256 }).withMessage('描述最长 256 个字符'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { code, name, description } = req.body
            const role = await rbacService.createRole({ code, name, description })
            res.status(201).json(success(role))
        } catch (error) {
            // Prisma 唯一约束冲突
            if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
                return sendError(res, '角色代码已存在', 409, 'CONFLICT')
            }
            next(error)
        }
    }
)

/**
 * 删除角色
 * DELETE /api/v1/rbac/roles/:roleCode
 */
router.delete(
    '/roles/:roleCode',
    [
        param('roleCode')
            .notEmpty().withMessage('角色代码不能为空')
            .isAlphanumeric().withMessage('角色代码格式无效'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { roleCode } = req.params
            const deleted = await rbacService.deleteRole(roleCode)

            if (!deleted) {
                return sendError(res, '无法删除系统内置角色或角色不存在', 400)
            }

            sendSuccess(res, null, '角色已删除')
        } catch (error) {
            next(error)
        }
    }
)

/**
 * 获取所有权限
 * GET /api/v1/rbac/permissions
 */
router.get('/permissions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const permissions = await rbacService.getAllPermissions()
        sendSuccess(res, permissions)
    } catch (error) {
        next(error)
    }
})

/**
 * 按资源分组获取权限
 * GET /api/v1/rbac/permissions/grouped
 */
router.get('/permissions/grouped', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const grouped = await rbacService.getPermissionsGroupedByResource()
        sendSuccess(res, grouped)
    } catch (error) {
        next(error)
    }
})

/**
 * 获取角色的权限列表
 * GET /api/v1/rbac/roles/:roleCode/permissions
 */
router.get(
    '/roles/:roleCode/permissions',
    [
        param('roleCode')
            .notEmpty().withMessage('角色代码不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { roleCode } = req.params
            const permissions = await rbacService.getRolePermissions(roleCode)
            sendSuccess(res, permissions)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * 更新角色权限 (接收 permissionCodes 数组)
 * PUT /api/v1/rbac/roles/:roleCode/permissions
 * Body: { permissionCodes: ["leads:create", "leads:read", ...] }
 */
router.put(
    '/roles/:roleCode/permissions',
    [
        param('roleCode')
            .notEmpty().withMessage('角色代码不能为空'),
        body('permissionCodes')
            .isArray().withMessage('permissionCodes 必须是数组')
            .custom((value: string[]) => {
                if (!value.every(v => typeof v === 'string' && /^[\w]+:[\w]+$/.test(v))) {
                    throw new Error('每个权限代码必须为 "resource:action" 格式')
                }
                return true
            }),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { roleCode } = req.params
            const { permissionCodes } = req.body

            await rbacService.setRolePermissions(roleCode, permissionCodes)
            sendSuccess(res, null, '权限已更新')
        } catch (error) {
            next(error)
        }
    }
)

export default router
