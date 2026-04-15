import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { customerAuth, validate } from '../middlewares/index.js'
import { sendSuccess, success } from '../utils/responseHelper.js'
import portalService from '../services/portalService.js'
import paymentService from '../services/paymentService.js'
import { chatService } from '../services/chatService.js'
import { signatureService } from '../services/signatureService.js'
import { aiDocumentService } from '../services/aiDocumentService.js'

const router = Router()

/**
 * GET /portal/profile - 获取客户个人资料
 */
router.get('/profile', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const profile = await portalService.getProfile(req.user!.id)
        sendSuccess(res, profile)
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
            sendSuccess(res, result)
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
        body('newPassword')
            .isLength({ min: 8 }).withMessage('新密码至少8个字符')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('新密码必须包含大小写字母和数字'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await portalService.changePassword(req.user!.id, req.body)
            // 密码修改成功后清除 refreshToken Cookie，强制重新登录
            res.clearCookie('refreshToken', { path: '/api/v1/auth' })
            sendSuccess(res, result)
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
        sendSuccess(res, projects)
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
        sendSuccess(res, project)
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
        sendSuccess(res, notifications)
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
        sendSuccess(res, stats)
    } catch (error) {
        next(error)
    }
})

// ==================== 账户删除与数据擦除接口 ====================

/**
 * DELETE /portal/account - 删除账户并匿名化个人数据
 */
router.delete('/account', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await portalService.deleteAccount(req.user!.id)
        // 清除 refresh token Cookie，使客户端会话立即失效
        res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' })
        sendSuccess(res, null, result.message)
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
        sendSuccess(res, result)
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
        sendSuccess(res, result)
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
        sendSuccess(res, message)
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
        sendSuccess(res, result)
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
        sendSuccess(res, result)
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
        sendSuccess(res, result)
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
        sendSuccess(res, result)
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
        sendSuccess(res, invoice)
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
            res.status(201).json(success(result))
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
            res.status(201).json(success(result))
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
            res.status(201).json(success(result))
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
    [
        body('name').optional().isString(),
        body('relationship').optional().isString(),
        body('birthDate').optional().isISO8601(),
        body('idNumber').optional().isString(),
        body('phone').optional().isString(),
        body('email').optional().isEmail(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await portalService.updateFamilyMember(req.user!.id, req.params.id, req.body)
            sendSuccess(res, result)
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
            sendSuccess(res, result)
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
    [
        body('emailNotifications').optional().isBoolean(),
        body('smsNotifications').optional().isBoolean(),
        body('language').optional().isIn(['zh-CN','en','ms']),
        body('timezone').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await portalService.updatePreferences(req.user!.id, req.body)
            sendSuccess(res, result)
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
            sendSuccess(res, result)
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
            sendSuccess(res, result)
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
            sendSuccess(res, categories)
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
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

// ==================== 在线支付接口 ====================

/**
 * POST /portal/payments/create-checkout - 创建Stripe Checkout Session
 */
router.post(
    '/payments/create-checkout',
    customerAuth,
    [
        body('invoiceId').notEmpty().withMessage('请提供发票ID'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await paymentService.createCheckoutSession(req.body.invoiceId, req.user!.id)
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /portal/payments/webhook - Stripe webhook回调
 * 注意：此端点必须在 express.json() 之前挂载 raw body 解析，
 * 因为 Stripe 签名验证需要原始请求体。
 * 这里使用 express.raw() 中间件单独处理。
 */
router.post(
    '/payments/webhook',
    // 使用 raw body 中间件，跳过全局 JSON 解析
    // Stripe 要求验证原始请求体，而非 JSON 解析后的对象
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 从原始请求体获取 payload
            const payload = req.body
            const signature = req.headers['stripe-signature'] as string

            if (!signature) {
                return res.status(400).json({ code: 'BAD_REQUEST', message: '缺少 Stripe 签名头' })
            }

            const result = await paymentService.handleWebhook(signature, payload)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /portal/payments/history - 获取支付历史
 */
router.get('/payments/history', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await paymentService.getPaymentHistory(req.user!.id)
        sendSuccess(res, result)
    } catch (error) {
        next(error)
    }
})

// ==================== 实时聊天接口 ====================

/**
 * GET /portal/chat/rooms - 获取聊天房间列表
 */
router.get('/chat/rooms', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rooms = await chatService.getCustomerRooms(req.user!.id)
        sendSuccess(res, rooms)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /portal/chat/rooms/:id/messages - 获取聊天消息历史
 */
router.get('/chat/rooms/:id/messages', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 30
        const result = await chatService.getRoomMessages(req.params.id, page, limit, req.user!.id)
        sendSuccess(res, result)
    } catch (error) {
        next(error)
    }
})

/**
 * POST /portal/chat/rooms/:id/messages - 发送消息
 */
router.post(
    '/chat/rooms/:id/messages',
    customerAuth,
    [
        body('content').notEmpty().withMessage('消息内容不能为空'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await chatService.sendPortalMessage(req.params.id, req.user!.id, req.body.content)
            res.status(201).json(success(result))
        } catch (error) {
            next(error)
        }
    }
)

// ==================== 电子签名接口 ====================

/**
 * POST /portal/signatures - 创建签名请求
 */
router.post(
    '/signatures',
    customerAuth,
    [
        body('documentId').notEmpty().withMessage('请提供文档ID'),
        body('projectId').notEmpty().withMessage('请提供项目ID'),
        body('signerEmail').isEmail().withMessage('请提供有效的签署者邮箱'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await signatureService.createSigningRequest(
                req.body.documentId,
                req.body.projectId,
                req.body.signerEmail
            )
            res.status(201).json(success(result))
        } catch (error) {
            next(error)
        }
    }
)

/**
 * POST /portal/signatures/:id/complete - 完成签署
 */
router.post(
    '/signatures/:id/complete',
    customerAuth,
    [
        body('signatureData').notEmpty().withMessage('未提供签名数据'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await signatureService.completeSigning(req.params.id, req.body.signatureData)
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * GET /portal/signatures - 获取签名请求列表
 */
router.get('/signatures', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const projectId = req.query.projectId as string
        if (!projectId) {
            sendSuccess(res, [])
            return
        }
        const result = await signatureService.getSigningRequests(projectId)
        sendSuccess(res, result)
    } catch (error) {
        next(error)
    }
})

// ==================== AI文档助手接口 ====================

/**
 * GET /portal/documents/checklist - 获取文档清单及完整性检查
 */
router.get('/documents/checklist', customerAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const projectType = req.query.projectType as string
        const projectId = req.query.projectId as string

        if (projectId) {
            const result = await aiDocumentService.checkDocumentCompleteness(projectId)
            sendSuccess(res, result)
            return
        }

        if (projectType) {
            const required = await aiDocumentService.getDocumentChecklist(projectType)
            sendSuccess(res, { required, missing: required, uploaded: [], total: required.length })
            return
        }

        sendSuccess(res, { required: [], missing: [], uploaded: [], total: 0 })
    } catch (error) {
        next(error)
    }
})

export default router
