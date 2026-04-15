import { Router, Request, Response, NextFunction } from 'express'
import { body, query } from 'express-validator'
import { inquiryService } from '../services/index.js'
import { validate, authMiddleware, optionalAuth } from '../middlewares/index.js'
import { sendSuccess, success } from '../utils/responseHelper.js'

const router = Router()

// 获取咨询详情
router.get(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await inquiryService.getInquiryById(req.params.id)
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

// 获取咨询列表 (仅管理员或员工)
router.get(
    '/',
    authMiddleware,
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt().toInt(),
        query('status').optional().isString()
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = Number(req.query.page) || 1
            const limit = Number(req.query.limit) || 20
            const status = req.query.status as any

            const result = await inquiryService.getInquiries(status, { page, limit })
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

// 创建咨询 (公开接口)
router.post(
    '/',
    optionalAuth,
    [
        body('name').notEmpty().withMessage('姓名不能为空'),
        body('message').notEmpty().withMessage('内容不能为空'),
        body('email').optional().isEmail(),
        body('phone').optional().isString()
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await inquiryService.createInquiry({
                ...req.body,
                ipAddress: req.ip
            })
            res.status(201).json(success(result))
        } catch (error) {
            next(error)
        }
    }
)

// 更新咨询状态
router.put(
    '/:id',
    authMiddleware,
    [
        body('status').optional().isIn(['NEW','IN_PROGRESS','RESOLVED','CLOSED']),
        body('assignedTo').optional().isString(),
        body('notes').optional().isString(),
        body('priority').optional().isIn(['LOW','MEDIUM','HIGH','URGENT']),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await inquiryService.updateInquiry(req.params.id, req.body)
            sendSuccess(res, result)
        } catch (error) {
            next(error)
        }
    }
)

// 删除咨询
router.delete(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await inquiryService.deleteInquiry(req.params.id)
            sendSuccess(res, null)
        } catch (error) {
            next(error)
        }
    }
)

export default router
