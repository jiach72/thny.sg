import { Router, Request, Response, NextFunction } from 'express'
import { body, query } from 'express-validator'
import { validate, authMiddleware } from '../middlewares/index.js'
import { projectService } from '../services/projectService.js'

const router = Router()

// 所有路由都需要认证
router.use(authMiddleware)

// 获取项目列表（管理端使用）
router.get(
    '/',
    [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('status').optional().isString(),
        query('customerId').optional().isString(),
        validate
    ],
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await projectService.getProjects(req.query)
            res.json(result)
        } catch (error) {
            next(error)
        }
    }
)

// 获取当前登录客户的项目列表
router.get('/mine', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // req.user 由 authMiddleware 提供，包含 email 和 role
        const projects = await projectService.getMyProjects(req.user!.email)
        res.json(projects)
    } catch (error) {
        next(error)
    }
})

// 获取单个项目详情
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        let project

        // 如果是客户角色，执行越权校验，仅允许查看自己的项目
        if (req.user!.role === 'CUSTOMER') {
            project = await projectService.getMyProjectById(req.params.id, req.user!.email)
        } else {
            project = await projectService.getProjectById(req.params.id)
        }

        if (!project) {
            return res.status(404).json({ message: '项目不存在或无权访问' })
        }
        res.json(project)
    } catch (error) {
        next(error)
    }
})

// 创建项目
router.post(
    '/',
    [
        body('title').notEmpty().withMessage('项目名称虽然可谓无名，但不可为空'),
        body('customerId').notEmpty().withMessage('必须关联客户'),
        body('projectType').notEmpty().withMessage('项目类型必填'),
        validate
    ],
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const project = await projectService.createProject(req.body)
            res.status(201).json(project)
        } catch (error) {
            next(error)
        }
    }
)

// 更新项目
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const project = await projectService.updateProject(req.params.id, req.body)
        res.json(project)
    } catch (error) {
        next(error)
    }
})

// 更新项目状态
router.patch(
    '/:id/status',
    [body('status').isIn(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']), validate],
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const project = await projectService.updateStatus(req.params.id, req.body.status)
            res.json(project)
        } catch (error) {
            next(error)
        }
    }
)

// 删除项目
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await projectService.deleteProject(req.params.id)
        res.status(204).send()
    } catch (error) {
        next(error)
    }
})

export default router
