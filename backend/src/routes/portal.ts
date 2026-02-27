import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { customerAuth, validate } from '../middlewares/index.js'
import portalService from '../services/portalService.js'

const router = Router()

/**
 * GET /portal/profile - 获取客户个人资料
 */
router.get('/profile', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const profile = await portalService.getProfile(req.user!.id)
        res.json(profile)
    } catch (error) {
        next(error)
    }
})

/**
 * PUT /portal/profile - 更新客户个人资料
 */
router.put(
    '/profile',
    customerAuth,
    [
        body('name').optional().isString(),
        body('phone').optional().isString(),
        body('company').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await portalService.updateProfile(req.user!.id, req.body)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /portal/change-password - 修改密码
 */
router.post(
    '/change-password',
    customerAuth,
    [
        body('currentPassword').notEmpty().withMessage('请输入当前密码'),
        body('newPassword').isLength({ min: 8 }).withMessage('新密码至少8个字符'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await portalService.changePassword(req.user!.id, req.body)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /portal/projects - 获取客户的项目列表
 */
router.get('/projects', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const projects = await portalService.getMyProjects(req.user!.id)
        res.json(projects)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /portal/projects/:id - 获取项目详情
 */
router.get('/projects/:id', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const project = await portalService.getProjectDetail(req.user!.id, req.params.id)
        res.json(project)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /portal/notifications - 获取待办/通知
 */
router.get('/notifications', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const notifications = await portalService.getNotifications(req.user!.id)
        res.json(notifications)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /portal/dashboard - 获取仪表板统计
 */
router.get('/dashboard', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await portalService.getDashboardStats(req.user!.id)
        res.json(stats)
    } catch (error) {
        next(error)
    }
})

// ==================== 站内消息接口 ====================
import messageService from '../services/messageService.js'
import exportService from '../services/exportService.js'

/**
 * GET /portal/export-data - 一键导出客户的个人资料与日志
 */
router.get('/export-data', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const buffer = await exportService.exportCustomerData(req.user!.id)

        const filename = `my_data_${new Date().toISOString().split('T')[0]}.xlsx`
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.send(buffer)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /portal/messages - 获取站内消息列表
 */
router.get('/messages', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 20
        const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined
        const type = req.query.type as string | undefined

        const result = await messageService.getMessages(req.user!.id, { isRead, type }, page, limit)
        res.json(result)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /portal/messages/unread-count - 获取未读消息数量
 */
router.get('/messages/unread-count', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await messageService.getUnreadCount(req.user!.id)
        res.json(result)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /portal/messages/:id - 获取消息详情
 */
router.get('/messages/:id', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const message = await messageService.getById(req.params.id, req.user!.id)
        res.json(message)
    } catch (error) {
        next(error)
    }
})

/**
 * PUT /portal/messages/:id/read - 标记消息为已读
 */
router.put('/messages/:id/read', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await messageService.markAsRead(req.params.id, req.user!.id)
        res.json(result)
    } catch (error) {
        next(error)
    }
})

/**
 * POST /portal/messages/mark-all-read - 全部标记为已读
 */
router.post('/messages/mark-all-read', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await messageService.markAllAsRead(req.user!.id)
        res.json(result)
    } catch (error) {
        next(error)
    }
})

/**
 * DELETE /portal/messages/:id - 删除消息
 */
router.delete('/messages/:id', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await messageService.delete(req.params.id, req.user!.id)
        res.json(result)
    } catch (error) {
        next(error)
    }
})

// ==================== 账单发票接口 ====================

/**
 * GET /portal/invoices - 获取客户的账单发票列表
 */
router.get('/invoices', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 20
        const status = req.query.status as string | undefined
        const result = await portalService.getInvoices(req.user!.id, { page, limit, status })
        res.json(result)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /portal/invoices/:id - 获取指定账单详情及其付款记录
 */
router.get('/invoices/:id', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invoice = await portalService.getInvoiceById(req.user!.id, req.params.id)
        res.json(invoice)
    } catch (error) {
        next(error)
    }
})

// ==================== 服务咨询与预约接口 ====================

/**
 * POST /portal/inquiries - 创建服务咨询
 */
router.post(
    '/inquiries',
    customerAuth,
    [
        body('serviceType').notEmpty().withMessage('请选择服务类型'),
        body('message').notEmpty().withMessage('请填写咨询内容'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await portalService.createInquiry(req.user!.id, req.body)
            res.status(201).json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /portal/appointments - 客户预约顾问 (防冲突)
 */
router.post(
    '/appointments',
    customerAuth,
    [
        body('title').notEmpty().withMessage('请提供会议主题'),
        body('startTime').isISO8601().withMessage('无效的开始时间'),
        body('endTime').isISO8601().withMessage('无效的结束时间'),
        body('userId').notEmpty().withMessage('必须指定顾问ID'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await portalService.bookAppointment(req.user!.id, req.body)
            res.status(201).json(result)
        } catch (error) {
            next(error)
        }
    }
)

// ==================== 家庭成员接口 ====================

/**
 * POST /portal/family-members - 添加家庭成员
 */
router.post(
    '/family-members',
    customerAuth,
    [
        body('name').notEmpty().withMessage('请填写成员姓名'),
        body('relationship').notEmpty().withMessage('请选择关系'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await portalService.addFamilyMember(req.user!.id, req.body)
            res.status(201).json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * PUT /portal/family-members/:id - 编辑家庭成员
 */
router.put(
    '/family-members/:id',
    customerAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await portalService.updateFamilyMember(req.user!.id, req.params.id, req.body)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * DELETE /portal/family-members/:id - 删除家庭成员
 */
router.delete(
    '/family-members/:id',
    customerAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await portalService.deleteFamilyMember(req.user!.id, req.params.id)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

// ==================== 通知偏好接口 ====================

/**
 * PUT /portal/preferences - 保存通知偏好
 */
router.put(
    '/preferences',
    customerAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await portalService.updatePreferences(req.user!.id, req.body)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

// ==================== 文档档案接口 ====================

/**
 * GET /portal/documents - 获取客户相关的文档列表（含签署诉求）
 */
router.get(
    '/documents',
    customerAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1
            const limit = parseInt(req.query.limit as string) || 20
            const result = await portalService.getDocuments(req.user!.id, { page, limit })
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /portal/documents/:id/sign - 模拟简易签章提交
 */
router.post(
    '/documents/:id/sign',
    customerAuth,
    [
        body('signatureData').notEmpty().withMessage('未提供签名数据')
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await portalService.signDocument(req.user!.id, req.params.id, req.body.signatureData)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

// ==================== 知识库与支持接口 ====================

/**
 * GET /portal/faqs - 获取启用的 FAQ 列表（按类别分组）
 */
router.get(
    '/faqs',
    customerAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const categories = await portalService.getFaqs()
            res.json(categories)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /portal/faqs/:id/helpful - 为帮助条目点赞
 */
router.post(
    '/faqs/:id/helpful',
    customerAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await portalService.markFaqHelpful(req.params.id)
            res.json(result)
        } catch (error) {
            res.json({ success: false })
        }
    }
)

export default router
