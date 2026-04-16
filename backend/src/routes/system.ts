import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../config/index.js'
import bcrypt from 'bcryptjs'
import { authRateLimiter } from '../middlewares/rateLimiter.js'
import { authMiddleware, requireRole } from '../middlewares/index.js'
import { sendSuccess, sendError, success } from '../utils/responseHelper.js'
import { ForbiddenError, BadRequestError } from '../middlewares/errorHandler.js'
import logger from '../config/logger.js'

const router = Router()

// ==================== 数据清除功能 ====================

/**
 * 生成确认码：基于当前日期的动态确认码
 * 格式：PURGE-YYYYMMDD（如 PURGE-20260416）
 * 管理员必须输入此确认码才能执行清除操作
 */
function generateConfirmCode(): string {
    const now = new Date()
    const dateStr = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0')
    return `PURGE-${dateStr}`
}

/**
 * 获取各类数据的统计数量
 */
async function getDataCounts() {
    const [
        users, leads, projects, tasks, documents, inquiries, appointments,
        customers, invoices, payments, chatSessions, vendors, claims, newsArticles,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.lead.count({ where: { deletedAt: null } }),
        prisma.project.count({ where: { deletedAt: null } }),
        prisma.task.count({ where: { deletedAt: null } }),
        prisma.document.count({ where: { deletedAt: null } }),
        prisma.inquiry.count(),
        prisma.appointment.count(),
        prisma.customer.count({ where: { deletedAt: null } }),
        prisma.invoice.count({ where: { deletedAt: null } }),
        prisma.payment.count({ where: { deletedAt: null } }),
        prisma.chatSession.count(),
        prisma.vendor.count({ where: { deletedAt: null } }),
        prisma.claim.count({ where: { deletedAt: null } }),
        prisma.newsArticle.count(),
    ])

    return {
        users, leads, projects, tasks, documents, inquiries, appointments,
        customers, invoices, payments, chatSessions, vendors, claims, newsArticles,
    }
}

/**
 * GET /system/data-status — 获取数据状态统计
 * 仅 ADMIN 角色可访问
 */
router.get(
    '/data-status',
    authMiddleware,
    requireRole('ADMIN'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dataCounts = await getDataCounts()
            const confirmCode = generateConfirmCode()

            sendSuccess(res, {
                dataCounts,
                confirmCode,
                environment: process.env.NODE_ENV || 'development',
            })
        } catch (error) {
            next(error)
        }
    }
)

/**
 * DELETE /system/purge-all-data — 一键清除所有数据
 * 严格限制：仅 ADMIN 角色 + 动态确认码验证
 * 保留 RBAC 角色权限配置和当前操作的管理员账号
 */
router.delete(
    '/purge-all-data',
    authMiddleware,
    requireRole('ADMIN'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 安全锁1：动态确认码验证（基于日期，防止误操作）
            const { confirm } = req.body
            const expectedCode = generateConfirmCode()
            if (confirm !== expectedCode) {
                throw new BadRequestError(
                    `确认码不匹配，当前正确确认码为：${expectedCode}。请在设置页面查看并输入正确的确认码。`
                )
            }

            // 执行清除（按外键依赖顺序）
            logger.warn('SystemPurge', `管理员 ${req.user!.email} 正在清除所有数据...`)

            const result = await prisma.$transaction(async (tx) => {
                const counts: Record<string, number> = {}

                // 按外键依赖从子到父清除
                // 1. 聊天相关
                counts.chatMessages = await tx.chatMessage.deleteMany({}).then(r => r.count)
                counts.chatSessions = await tx.chatSession.deleteMany({}).then(r => r.count)
                counts.unrecognizedQuestions = await tx.unrecognizedQuestion.deleteMany({}).then(r => r.count)

                // 2. 工作流
                counts.workflowExecutions = await tx.workflowExecution.deleteMany({}).then(r => r.count)
                counts.workflowDefinitions = await tx.workflowDefinition.deleteMany({}).then(r => r.count)

                // 3. Webhook
                counts.webhookLogs = await tx.webhookLog.deleteMany({}).then(r => r.count)
                counts.webhookEndpoints = await tx.webhookEndpoint.deleteMany({}).then(r => r.count)

                // 4. 审计日志
                counts.auditLogs = await tx.auditLog.deleteMany({}).then(r => r.count)

                // 5. 消息
                counts.messages = await tx.message.deleteMany({}).then(r => r.count)

                // 6. 签署请求
                counts.signatureRequests = await tx.signatureRequest.deleteMany({}).then(r => r.count)

                // 7. 文档
                counts.documents = await tx.document.deleteMany({}).then(r => r.count)

                // 8. 任务
                counts.tasks = await tx.task.deleteMany({}).then(r => r.count)

                // 9. 预约 + 会议纪要
                counts.meetingMinutes = await tx.meetingMinutes.deleteMany({}).then(r => r.count)
                counts.appointments = await tx.appointment.deleteMany({}).then(r => r.count)

                // 10. 活动
                counts.activities = await tx.activity.deleteMany({}).then(r => r.count)

                // 11. 咨询
                counts.inquiries = await tx.inquiry.deleteMany({}).then(r => r.count)

                // 12. 项目
                counts.projects = await tx.project.deleteMany({}).then(r => r.count)

                // 13. 家庭成员
                counts.familyMembers = await tx.familyMember.deleteMany({}).then(r => r.count)

                // 14. 客户
                counts.customers = await tx.customer.deleteMany({}).then(r => r.count)

                // 15. 线索
                counts.leads = await tx.lead.deleteMany({}).then(r => r.count)

                // 16. 报销
                counts.claimItems = await tx.claimItem.deleteMany({}).then(r => r.count)
                counts.claims = await tx.claim.deleteMany({}).then(r => r.count)

                // 17. 供应商
                counts.vendorAssignments = await tx.vendorAssignment.deleteMany({}).then(r => r.count)
                counts.vendors = await tx.vendor.deleteMany({}).then(r => r.count)

                // 18. 邮件日志
                counts.emailLogs = await tx.emailLog.deleteMany({}).then(r => r.count)

                // 19. 付款 + 发票
                counts.paymentGatewayTransactions = await tx.paymentGatewayTransaction.deleteMany({}).then(r => r.count)
                counts.payments = await tx.payment.deleteMany({}).then(r => r.count)
                counts.invoices = await tx.invoice.deleteMany({}).then(r => r.count)

                // 20. 分析指标
                counts.salesMetrics = await tx.salesMetric.deleteMany({}).then(r => r.count)
                counts.channelMetrics = await tx.channelMetric.deleteMany({}).then(r => r.count)

                // 21. 新闻 + RSS
                counts.newsArticles = await tx.newsArticle.deleteMany({}).then(r => r.count)
                counts.rssFeeds = await tx.rssFeed.deleteMany({}).then(r => r.count)

                // 22. FAQ
                counts.faqItems = await tx.faqItem.deleteMany({}).then(r => r.count)
                counts.faqCategories = await tx.faqCategory.deleteMany({}).then(r => r.count)

                // 23. 邮件模板
                counts.emailTemplates = await tx.emailTemplate.deleteMany({}).then(r => r.count)

                // 24. 评分规则
                counts.scoringRules = await tx.scoringRule.deleteMany({}).then(r => r.count)

                // 25. 会议室
                counts.meetingRooms = await tx.meetingRoom.deleteMany({}).then(r => r.count)

                // 26. 报销分类配置
                counts.expenseCategoryConfigs = await tx.expenseCategoryConfig.deleteMany({}).then(r => r.count)

                // 27. 系统设置（保留 RBAC 数据）
                counts.systemSettings = await tx.systemSetting.deleteMany({}).then(r => r.count)

                // 28. 用户（保留当前操作的管理员账号，删除其他所有用户）
                const currentAdminId = (req.user as any)?.id
                // 删除所有非当前管理员的用户
                counts.users = await tx.user.deleteMany({
                    where: { id: { not: currentAdminId } }
                }).then(r => r.count)

                return counts
            })

            // 统计总删除数
            const totalDeleted = Object.values(result).reduce((sum, n) => sum + n, 0)

            logger.warn('SystemPurge', `所有数据清除完成，共删除 ${totalDeleted} 条记录。操作人：${req.user!.email}`)

            sendSuccess(res, {
                deleted: result,
                totalDeleted,
                message: `已成功清除 ${totalDeleted} 条数据，系统保留 RBAC 角色权限配置和当前管理员账号`,
            })
        } catch (error) {
            next(error)
        }
    }
)

router.get('/status', async (req, res, next) => {
    try {
        const userCount = await prisma.user.count()
        sendSuccess(res, { isInitialized: userCount > 0 })
    } catch (error) {
        next(error)
    }
})

router.post('/init', authRateLimiter, async (req, res, next) => {
    try {
        const existingAdmin = await prisma.user.findFirst({
            where: { role: { code: 'ADMIN' } },
        })
        if (existingAdmin) {
            throw new ForbiddenError('系统已初始化，禁止非法访问此接口')
        }

        const { name, email, password } = req.body
        if (!name || !email || !password) {
            return sendError(res, '须提供名称、邮箱与密码', 400)
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return sendError(res, '邮箱格式不正确', 400)
        }

        if (password.length < 8) {
            return sendError(res, '密码长度不能少于8位', 400)
        }

        const passwordHash = await bcrypt.hash(password, 12)

        const result = await prisma.$transaction(async (tx) => {
            const userCount = await tx.user.count()
            if (userCount > 0) {
                throw new ForbiddenError('系统已初始化，禁止非法访问此接口')
            }

            let adminRole = await tx.role.findUnique({ where: { code: 'ADMIN' } })
            if (!adminRole) {
                adminRole = await tx.role.create({
                    data: {
                        name: '超级管理员',
                        code: 'ADMIN',
                        description: '系统最高权限超级管理员',
                        isSystem: true,
                    }
                })
            }

            const admin = await tx.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                    roleId: adminRole.id,
                }
            })

            return admin
        })

        res.status(201).json(success({ id: result.id, email: result.email }, '系统初始化成功'))
    } catch (error) {
        next(error)
    }
})

export default router
