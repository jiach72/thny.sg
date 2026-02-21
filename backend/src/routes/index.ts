import { Router } from 'express'
import { prisma } from '../config/index.js'
import { getRedis } from '../config/redis.js'
import authRoutes from './auth.js'
import leadRoutes from './leads.js'
import taskRoutes from './tasks.js'
import projectRoutes from './projects.js'
import customerRoutes from './customers.js'
import documentRoutes from './documents.js'
import portalRoutes from './portal.js'
import messageRoutes from './messages.js'
import appointmentRoutes from './appointments.js'
import inquiryRoutes from './inquiries.js'
import rbacRoutes from './rbac.js'
import usersRoutes from './users.js'
import chatRoutes from './chat.js'
import faqAdminRoutes from './faqAdmin.js'
import newsRoutes from './news.js'
import newsAdminRoutes from './newsAdmin.js'
import settingsRoutes from './settings.js'
import scoringRoutes from './scoring.js'
import emailTemplateRoutes from './emailTemplates.js'
import invoiceRoutes from './invoices.js'
import workflowRoutes from './workflow.js'
import schedulerRoutes from './scheduler.js'
import analyticsRoutes from './analytics.js'
import auditRoutes from './audit.js'
import exportRoutes from './export.js'

const router = Router()

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 健康检查
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: 所有服务健康
 *       503:
 *         description: 部分服务不健康
 */
router.get('/health', async (_req, res) => {
    const checks: {
        status: string
        timestamp: string
        uptime: number
        services: Record<string, string>
    } = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        services: {
            database: 'unknown',
            redis: 'unknown',
        }
    }

    // 检查数据库连接
    try {
        await prisma.$queryRaw`SELECT 1`
        checks.services.database = 'healthy'
    } catch {
        checks.services.database = 'unhealthy'
    }

    // 检查 Redis 连接
    try {
        const redis = getRedis()
        await redis.ping()
        checks.services.redis = 'healthy'
    } catch {
        checks.services.redis = 'unhealthy'
    }

    const allHealthy = Object.values(checks.services).every(s => s === 'healthy')
    checks.status = allHealthy ? 'ok' : 'degraded'
    res.status(allHealthy ? 200 : 503).json(checks)
})

// API 版本信息
router.get('/', (req, res) => {
    res.json({
        name: 'TongHai CRM API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v1/auth',
            leads: '/api/v1/leads',
            tasks: '/api/v1/tasks',
            projects: '/api/v1/projects',
            customers: '/api/v1/customers',
            documents: '/api/v1/documents',
            messages: '/api/v1/messages (管理端发送)',
            portal: '/api/v1/portal (客户专用)',
            rbac: '/api/v1/rbac (权限管理)',
            users: '/api/v1/users (用户管理)',
            scoring: '/api/v1/scoring (线索评分)',
            emailTemplates: '/api/v1/email-templates (邮件模板)',
            invoices: '/api/v1/invoices (发票管理)',
            workflow: '/api/v1/workflow (工作流)',
            scheduler: '/api/v1/scheduler (定时任务)',
            analytics: '/api/v1/analytics (销售分析)',
            audit: '/api/v1/audit (审计日志)',
        },
    })
})

// CRM 管理端路由
router.use('/auth', authRoutes)
router.use('/leads', leadRoutes)
router.use('/tasks', taskRoutes)
router.use('/projects', projectRoutes)
router.use('/customers', customerRoutes)
router.use('/documents', documentRoutes)
router.use('/messages', messageRoutes)
router.use('/appointments', appointmentRoutes)
router.use('/inquiries', inquiryRoutes)
router.use('/rbac', rbacRoutes)
router.use('/users', usersRoutes)
router.use('/scoring', scoringRoutes)
router.use('/email-templates', emailTemplateRoutes)
router.use('/invoices', invoiceRoutes)
router.use('/workflow', workflowRoutes)
router.use('/scheduler', schedulerRoutes)
router.use('/analytics', analyticsRoutes)
router.use('/audit', auditRoutes)
router.use('/export', exportRoutes)

// 客户门户专用路由
router.use('/portal', portalRoutes)

// 聊天机器人 API（官网公开接口）
router.use('/chat', chatRoutes)

// FAQ 管理后台 API（需认证）
router.use('/faq-admin', faqAdminRoutes)

// 新闻 API
router.use('/news', newsRoutes)
router.use('/news-admin', newsAdminRoutes)
router.use('/settings', settingsRoutes)

export default router


