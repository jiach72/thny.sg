import { Router, Request, Response, NextFunction } from 'express'
import { query } from 'express-validator'
import { adminAuth } from '../middlewares/auth.js'
import { validate } from '../middlewares/validation.js'
import { analyticsService } from '../services/analyticsService.js'
import { sendSuccess } from '../utils/responseHelper.js'

const router = Router()

// 所有路由需要管理员权限
router.use(adminAuth)

// 销售漏斗数据
router.get('/sales-funnel', [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
], validate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query
        const data = await analyticsService.getSalesFunnel({
            startDate: startDate as string,
            endDate: endDate as string,
        })
        sendSuccess(res, data)
    } catch (error) {
        next(error)
    }
})

// 趋势数据
router.get('/trend', [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('months').optional().isInt({ min: 1, max: 24 }),
], validate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { period = 'month', months = '6' } = req.query
        const data = await analyticsService.getTrend(
            period as string,
            Number(months)
        )
        sendSuccess(res, data)
    } catch (error) {
        next(error)
    }
})

// 营收趋势
router.get('/revenue-trend', [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('months').optional().isInt({ min: 1, max: 24 }),
], validate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { period = 'month', months = '6' } = req.query
        const data = await analyticsService.getRevenueTrend(
            period as string,
            Number(months)
        )
        sendSuccess(res, data)
    } catch (error) {
        next(error)
    }
})

// 渠道效果
router.get('/channels', [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
], validate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query
        const data = await analyticsService.getChannelMetrics({
            startDate: startDate as string,
            endDate: endDate as string,
        })
        sendSuccess(res, data)
    } catch (error) {
        next(error)
    }
})

// 团队绩效
router.get('/team-performance', [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
], validate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate } = req.query
        const data = await analyticsService.getTeamPerformance({
            startDate: startDate as string,
            endDate: endDate as string,
        })
        sendSuccess(res, data)
    } catch (error) {
        next(error)
    }
})

// 预测数据
router.get('/forecast', [
    query('months').optional().isInt({ min: 1, max: 24 }),
], validate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { months = '3' } = req.query
        const data = await analyticsService.getForecast(Number(months))
        sendSuccess(res, data)
    } catch (error) {
        next(error)
    }
})

export default router
