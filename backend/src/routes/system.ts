import { Router } from 'express'
import { prisma } from '../config/index.js'
import bcrypt from 'bcryptjs'

const router = Router()

/**
 * @swagger
 * /api/v1/system/status:
 *   get:
 *     summary: 获取系统初始化状态
 *     tags: [System]
 *     responses:
 *       200:
 *         description: 返回布尔值 indicating if the system is properly initialized (has admin user)
 */
router.get('/status', async (req, res) => {
    try {
        const userCount = await prisma.user.count()
        res.json({
            success: true,
            data: {
                isInitialized: userCount > 0,
            },
        })
    } catch (error) {
        console.error('Failed to get system status:', error)
        res.status(500).json({ success: false, message: '检查系统状态失败' })
    }
})

/**
 * @swagger
 * /api/v1/system/init:
 *   post:
 *     summary: 首次启动初始化超级管理员
 *     tags: [System]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 初始化成功
 */
router.post('/init', async (req, res) => {
    try {
        const userCount = await prisma.user.count()
        if (userCount > 0) {
            return res.status(403).json({ success: false, message: '系统已初始化，禁止非法访问此接口' })
        }

        const { name, email, password } = req.body
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: '须提供名称、邮箱与密码' })
        }

        const passwordHash = await bcrypt.hash(password, 12)

        // 我们需要确保超级管理员的角色已经被 Seed 或在这个时刻进行兜底 Seed
        let adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } })
        if (!adminRole) {
            adminRole = await prisma.role.create({
                data: {
                    name: '超级管理员',
                    code: 'ADMIN',
                    description: '系统最高权限超级管理员',
                    isSystem: true,
                }
            })
        }

        const admin = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                roleId: adminRole.id,
            }
        })

        // 也帮他预生成一个基础设置（公司名等）如果需要的话...

        res.status(201).json({
            success: true,
            message: '系统初始化成功',
            data: {
                id: admin.id,
                email: admin.email,
            }
        })
    } catch (error) {
        console.error('System initialization failed:', error)
        res.status(500).json({ success: false, message: '初始化过程发生异常' })
    }
})

export default router
