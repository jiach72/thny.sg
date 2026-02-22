import { Router } from 'express'
import { authMiddleware, requireRole } from '../middlewares/auth.js'
import { prisma } from '../config/index.js'
import bcrypt from 'bcryptjs'

const router = Router()

// 所有用户管理路由需要认证且仅限 ADMIN 或 MANAGER
router.use(authMiddleware)
router.use(requireRole('ADMIN', 'MANAGER'))

/**
 * 获取用户列表
 * GET /api/v1/users
 */
router.get('/', async (req, res) => {
    try {
        const { search, roleCode, status } = req.query

        const where: any = {}

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } },
            ]
        }

        if (roleCode) {
            where.role = { code: roleCode }
        } else {
            // 默认排除 CUSTOMER 角色，仅显示内部员工
            where.role = { code: { not: 'CUSTOMER' } }
        }

        if (status) {
            where.status = status
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                roleId: true,
                role: { select: { id: true, code: true, name: true } },
                department: true,
                status: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        })

        res.json({ data: users })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

/**
 * 获取单个用户
 * GET /api/v1/users/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                name: true,
                email: true,
                roleId: true,
                role: { select: { id: true, code: true, name: true } },
                department: true,
                status: true,
                createdAt: true,
            },
        })

        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' })
        }

        res.json({ data: user })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

/**
 * 创建用户
 * POST /api/v1/users
 */
router.post('/', requireRole('ADMIN'), async (req, res) => {
    try {
        const { name, email, password, roleId, department } = req.body

        if (!name || !email || !password || !roleId) {
            return res.status(400).json({
                success: false,
                message: '姓名、邮箱、密码和角色为必填项'
            })
        }

        // 检查邮箱是否已存在
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return res.status(409).json({ success: false, message: '该邮箱已被注册' })
        }

        const passwordHash = await bcrypt.hash(password, 12)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                roleId,
                department,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: { select: { code: true, name: true } },
            },
        })

        res.status(201).json({ success: true, data: user })
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message })
    }
})

/**
 * 更新用户
 * PUT /api/v1/users/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const { name, roleId, department, status } = req.body

        // 非 ADMIN 不能修改角色
        if (roleId && req.user?.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: '仅管理员可修改用户角色' })
        }

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (roleId !== undefined) updateData.roleId = roleId
        if (department !== undefined) updateData.department = department
        if (status !== undefined) updateData.status = status

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: { select: { code: true, name: true } },
                department: true,
                status: true,
            },
        })

        res.json({ success: true, data: user })
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: '用户不存在' })
        }
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
