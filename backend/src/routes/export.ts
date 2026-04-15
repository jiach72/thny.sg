import { Router, Request, Response, NextFunction } from 'express'
import { query } from 'express-validator'
import { authMiddleware, adminAuth, validate } from '../middlewares/index.js'
import { exportService } from '../services/exportService.js'

const router = Router()

// 数据导出路由仅限管理端用户（敏感数据不可被 CUSTOMER 角色导出）
router.use(authMiddleware)
router.use(adminAuth)

/**
 * @swagger
 * tags:
 *   name: Export
 *   description: 数据导出接口
 */

/**
 * @swagger
 * /export/leads:
 *   get:
 *     summary: 导出线索列表 (Excel)
 *     tags: [Export]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *         description: 起始日期
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *         description: 结束日期
 *     responses:
 *       200:
 *         description: Excel 文件下载
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
    '/leads',
    authMiddleware,
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const buffer = await exportService.exportLeads({
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string,
            })

            const filename = `leads_${new Date().toISOString().split('T')[0]}.xlsx`
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
            res.send(buffer)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * @swagger
 * /export/invoices:
 *   get:
 *     summary: 导出发票列表 (Excel)
 *     tags: [Export]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Excel 文件下载
 */
router.get(
    '/invoices',
    authMiddleware,
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const buffer = await exportService.exportInvoices({
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string,
            })

            const filename = `invoices_${new Date().toISOString().split('T')[0]}.xlsx`
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
            res.send(buffer)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * @swagger
 * /export/audit-logs:
 *   get:
 *     summary: 导出审计日志 (Excel)
 *     tags: [Export]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Excel 文件下载
 */
router.get(
    '/audit-logs',
    authMiddleware,
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const buffer = await exportService.exportAuditLogs({
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string,
            })

            const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
            res.send(buffer)
        } catch (error) {
            next(error)
        }
    }
)

export default router
