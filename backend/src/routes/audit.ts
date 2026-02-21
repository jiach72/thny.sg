import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.js'
import { auditService } from '../services/auditService.js'

const router = Router()

// 所有路由需要认证 + 仅管理员可查看审计日志
router.use(authMiddleware)

// 查询审计日志
router.get('/', async (req, res, next) => {
    try {
        // 仅管理员可查看
        if (req.user!.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: '仅管理员可查看审计日志' },
            })
        }

        const data = await auditService.getAuditLogs({
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
            userId: req.query.userId as string,
            action: req.query.action as string,
            resource: req.query.resource as string,
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string,
        })

        res.json({ success: true, ...data })
    } catch (error) {
        next(error)
    }
})

export default router
