import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../config/index.js'
import bcrypt from 'bcryptjs'
import { authRateLimiter } from '../middlewares/rateLimiter.js'
import { authMiddleware, requireRole } from '../middlewares/index.js'
import { sendSuccess, sendError, success } from '../utils/responseHelper.js'
import { ForbiddenError, BadRequestError } from '../middlewares/errorHandler.js'
import logger from '../config/logger.js'

const router = Router()

// ==================== 测试数据清除功能 ====================

/** 种子脚本创建的测试邮箱后缀列表 */
const TEST_EMAIL_DOMAINS = ['@thny.sg', '@example.com', '@startup.io', '@global.com']

/** 种子脚本创建的测试邮箱精确匹配列表 */
const TEST_EMAIL_EXACT = ['client@example.com', 'liming@startup.io', 'harvey@global.com']

/** 种子脚本创建的测试项目标题 */
const TEST_PROJECT_TITLES = ['Global Family Trust Setup', 'Singapore EP Application', 'Corporate Tax Planning 2024']

/**
 * 检测系统中是否存在真实业务数据
 * 规则：
 * 1. 若有非测试邮箱的 ADMIN 用户 → 有真实数据
 * 2. 若有非种子脚本创建的 Lead/Customer/Project → 有真实数据
 * 3. 若有任何 Invoice/Payment/SignatureRequest → 有真实数据
 */
async function detectRealBusinessData(): Promise<{ hasRealData: boolean; details: string[] }> {
    const warnings: string[] = []

    // 检查是否有非测试邮箱的管理员
    const allAdmins = await prisma.user.findMany({
        where: { role: { code: 'ADMIN' } },
        select: { email: true },
    })
    const nonTestAdmins = allAdmins.filter(u =>
        !TEST_EMAIL_EXACT.includes(u.email) &&
        !TEST_EMAIL_DOMAINS.some(d => u.email.endsWith(d))
    )
    if (nonTestAdmins.length > 0) {
        warnings.push(`存在 ${nonTestAdmins.length} 个非测试管理员账号`)
    }

    // 检查是否有非种子脚本创建的项目
    const realProjects = await prisma.project.count({
        where: {
            title: { notIn: TEST_PROJECT_TITLES },
            deletedAt: null,
        }
    })
    if (realProjects > 0) {
        warnings.push(`存在 ${realProjects} 个非测试项目`)
    }

    // 检查是否有发票/付款记录（这些通常是真实业务数据）
    const invoiceCount = await prisma.invoice.count({ where: { deletedAt: null } })
    if (invoiceCount > 0) {
        warnings.push(`存在 ${invoiceCount} 条发票记录`)
    }

    const paymentCount = await prisma.payment.count({ where: { deletedAt: null } })
    if (paymentCount > 0) {
        warnings.push(`存在 ${paymentCount} 条付款记录`)
    }

    // 检查是否有签署请求
    const signatureCount = await prisma.signatureRequest.count()
    if (signatureCount > 0) {
        warnings.push(`存在 ${signatureCount} 条电子签署请求`)
    }

    // 检查是否有非测试邮箱的客户
    const _realCustomers = await prisma.customer.count({
        where: {
            deletedAt: null,
            email: { notIn: TEST_EMAIL_EXACT },
        }
    })
    // 还需排除 @thny.sg 后缀的客户（内部员工测试账号关联的客户不算真实）
    const testCustomerEmails = (await prisma.customer.findMany({
        where: { email: { not: null } },
        select: { email: true },
    })).filter(c => c.email && TEST_EMAIL_DOMAINS.some(d => c.email!.endsWith(d)))
    const testCustomerEmailList = testCustomerEmails.map(c => c.email!)
    const trulyRealCustomers = await prisma.customer.count({
        where: {
            deletedAt: null,
            email: { notIn: [...TEST_EMAIL_EXACT, ...testCustomerEmailList] },
        }
    })
    if (trulyRealCustomers > 0) {
        warnings.push(`存在 ${trulyRealCustomers} 个非测试客户`)
    }

    return { hasRealData: warnings.length > 0, details: warnings }
}

/**
 * GET /system/test-data-status — 检查测试数据状态
 * 仅 ADMIN 角色可访问
 */
router.get(
    '/test-data-status',
    authMiddleware,
    requireRole('ADMIN'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { hasRealData, details } = await detectRealBusinessData()

            // 统计测试数据量
            const testUsers = await prisma.user.count({
                where: {
                    OR: [
                        ...TEST_EMAIL_EXACT.map(e => ({ email: e })),
                        ...TEST_EMAIL_DOMAINS.map(d => ({ email: { endsWith: d } })),
                    ]
                }
            })
            const testLeads = await prisma.lead.count({
                where: { deletedAt: null }
            })
            const testProjects = await prisma.project.count({
                where: { title: { in: TEST_PROJECT_TITLES }, deletedAt: null }
            })
            const testTasks = await prisma.task.count({ where: { deletedAt: null } })
            const testDocuments = await prisma.document.count({ where: { deletedAt: null } })
            const testInquiries = await prisma.inquiry.count()
            const testAppointments = await prisma.appointment.count()

            sendSuccess(res, {
                canPurge: !hasRealData,
                hasRealData,
                realDataWarnings: details,
                testDataCounts: {
                    users: testUsers,
                    leads: testLeads,
                    projects: testProjects,
                    tasks: testTasks,
                    documents: testDocuments,
                    inquiries: testInquiries,
                    appointments: testAppointments,
                },
                environment: process.env.NODE_ENV || 'development',
            })
        } catch (error) {
            next(error)
        }
    }
)

/**
 * DELETE /system/purge-test-data — 一键清除所有测试数据
 * 严格限制：仅 ADMIN 角色 + 无真实业务数据 + 非生产环境
 */
router.delete(
    '/purge-test-data',
    authMiddleware,
    requireRole('ADMIN'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 安全锁1：生产环境禁止
            if (process.env.NODE_ENV === 'production') {
                throw new ForbiddenError('生产环境严禁执行测试数据清除操作')
            }

            // 安全锁2：二次确认参数
            const { confirm } = req.body
            if (confirm !== 'PURGE_ALL_TEST_DATA') {
                throw new BadRequestError('请传入正确的确认参数 confirm="PURGE_ALL_TEST_DATA"')
            }

            // 安全锁3：检测真实业务数据
            const { hasRealData, details } = await detectRealBusinessData()
            if (hasRealData) {
                throw new ForbiddenError(
                    `系统中已存在真实业务数据，禁止清除。详情：${details.join('；')}`
                )
            }

            // 执行清除（按外键依赖顺序）
            logger.warn('SystemPurge', `管理员 ${req.user!.email} 正在清除所有测试数据...`)

            const result = await prisma.$transaction(async (tx) => {
                // 再次在事务内检测真实数据（防止竞态）
                const recheck = await detectRealBusinessData()
                if (recheck.hasRealData) {
                    throw new ForbiddenError('并发检测到真实业务数据，操作已中止')
                }

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

                // 28. 用户（保留 ADMIN 角色用户，删除其他）
                const adminRole = await tx.role.findUnique({ where: { code: 'ADMIN' } })
                if (adminRole) {
                    // 删除所有非 ADMIN 用户
                    counts.users = await tx.user.deleteMany({
                        where: { roleId: { not: adminRole.id } }
                    }).then(r => r.count)
                    // 删除 ADMIN 中的测试账号
                    const testAdminEmails = ['admin@thny.sg']
                    counts.adminTestUsers = await tx.user.deleteMany({
                        where: { email: { in: testAdminEmails }, roleId: adminRole.id }
                    }).then(r => r.count)
                }

                return counts
            })

            // 统计总删除数
            const totalDeleted = Object.values(result).reduce((sum, n) => sum + n, 0)

            logger.warn('SystemPurge', `测试数据清除完成，共删除 ${totalDeleted} 条记录`)

            sendSuccess(res, {
                deleted: result,
                totalDeleted,
                message: `已成功清除 ${totalDeleted} 条测试数据，系统保留 RBAC 角色权限配置`,
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
