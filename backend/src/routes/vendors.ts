import { Router, Request, Response, NextFunction } from 'express'
import { body, query, param } from 'express-validator'
import { vendorService } from '../services/vendorService.js'
import { validate, authMiddleware } from '../middlewares/index.js'

const router = Router()

/**
 * @openapi
 * /vendors:
 *   get:
 *     tags: [Vendors]
 *     summary: 获取供应商列表
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: 供应商类型筛选
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 供应商状态筛选
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 关键词搜索
 *     responses:
 *       200:
 *         description: 成功获取供应商列表
 *       401:
 *         description: 未授权
 */
// 获取供应商列表
router.get(
    '/',
    authMiddleware,
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('type').optional().isString(),
        query('status').optional().isString(),
        query('search').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = Number(req.query.page) || 1
            const limit = Number(req.query.limit) || 20
            const filters = {
                type: req.query.type as any,
                status: req.query.status as any,
                search: req.query.search as string,
            }

            const result = await vendorService.getVendorList(filters, { page, limit })
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

// 获取供应商统计
router.get(
    '/stats',
    authMiddleware,
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await vendorService.getVendorStats()
            res.json(stats)
        } catch (error) {
            next(error)
        }
    }
)

// 获取供应商详情
router.get(
    '/:id',
    authMiddleware,
    [param('id').isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const vendor = await vendorService.getVendorById(req.params.id)
            res.json(vendor)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * @openapi
 * /vendors:
 *   post:
 *     tags: [Vendors]
 *     summary: 创建供应商
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: 供应商创建成功
 *       401:
 *         description: 未授权
 */
// 创建供应商
router.post(
    '/',
    authMiddleware,
    [
        body('name').notEmpty().withMessage('供应商名称不能为空'),
        body('type').optional().isString(),
        body('contactEmail').optional({ checkFalsy: true }).isEmail().withMessage('邮箱格式不正确'),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const vendor = await vendorService.createVendor(req.body)
            res.status(201).json(vendor)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * @openapi
 * /vendors/{id}:
 *   put:
 *     tags: [Vendors]
 *     summary: 更新供应商
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               category:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: 更新成功
 *       401:
 *         description: 未授权
 *       404:
 *         description: 供应商不存在
 */
// 更新供应商
router.put(
    '/:id',
    authMiddleware,
    [
        param('id').isString(),
        body('name').optional().isString(),
        body('contactPerson').optional().isString(),
        body('email').optional().isEmail(),
        body('phone').optional().isString(),
        body('category').optional().isString(),
        body('status').optional().isIn(['ACTIVE','INACTIVE']),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const vendor = await vendorService.updateVendor(req.params.id, req.body)
            res.json(vendor)
        } catch (error) {
            next(error)
        }
    }
)

/**
 * @openapi
 * /vendors/{id}:
 *   delete:
 *     tags: [Vendors]
 *     summary: 软删除供应商
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 *       401:
 *         description: 未授权
 *       404:
 *         description: 供应商不存在
 */
// 软删除供应商
router.delete(
    '/:id',
    authMiddleware,
    [param('id').isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await vendorService.deleteVendor(req.params.id)
            res.json({ success: true, message: '供应商已删除' })
        } catch (error) {
            next(error)
        }
    }
)

// 分配供应商到项目
router.post(
    '/:id/assign',
    authMiddleware,
    [
        param('id').isString(),
        body('projectId').notEmpty().withMessage('项目ID不能为空'),
        body('role').notEmpty().withMessage('角色不能为空'),
        body('fee').optional().isNumeric(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const assignment = await vendorService.assignToProject(req.params.id, req.body)
            res.status(201).json(assignment)
        } catch (error) {
            next(error)
        }
    }
)

// 更新分配
router.put(
    '/assignments/:id',
    authMiddleware,
    [
        param('id').isString(),
        body('status').optional().isIn(['PENDING','ACTIVE','COMPLETED','CANCELLED']),
        body('notes').optional().isString(),
    ],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const assignment = await vendorService.updateAssignment(req.params.id, req.body)
            res.json(assignment)
        } catch (error) {
            next(error)
        }
    }
)

// 移除分配
router.delete(
    '/assignments/:id',
    authMiddleware,
    [param('id').isString()],
    validate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await vendorService.removeAssignment(req.params.id)
            res.json({ success: true, message: '分配已移除' })
        } catch (error) {
            next(error)
        }
    }
)

export default router
