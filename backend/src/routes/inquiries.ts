import { Router, Request, Response, NextFunction } from 'express'
import { body, query } from 'express-validator'
import { inquiryService } from '../services/index.js'
import { validate, authMiddleware, optionalAuth } from '../middlewares/index.js'

const router = Router()

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
            res.json(result)
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
            res.status(201).json(result)
        } catch (error) {
            next(error)
        }
    }
)

// 更新咨询状态
router.put(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await inquiryService.updateInquiry(req.params.id, req.body)
            res.json(result)
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
            res.json({ success: true })
        } catch (error) {
            next(error)
        }
    }
)

export default router
