import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { authMiddleware } from '../middlewares/index.js'
import { documentService } from '../services/documentService.js'
import { NotFoundError, ForbiddenError } from '../middlewares/errorHandler.js'
import { prisma } from '../config/index.js'
import { sendSuccess, sendError } from '../utils/responseHelper.js'

// 配置 Multer 存储
const uploadDir = 'uploads/'
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, uploadDir)
    },
    filename: function (_req, file, cb) {
        // 防止文件名冲突，添加时间戳
        // 并保留原始后缀
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    },
})

// 文件类型白名单过滤：仅允许常见图片、文档、表格格式
const documentFileFilter = (_req: any, file: any, cb: any) => {
    const allowedMimes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
    ]
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('不支持的文件类型，仅允许 JPG/PNG/GIF/WebP/PDF/Word/Excel/TXT 文件'), false)
    }
}

// 文件大小限制：从环境变量读取，默认 5MB
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '5242880', 10)

const upload = multer({
    storage: storage,
    limits: { fileSize: maxFileSize },
    fileFilter: documentFileFilter,
})

const router = Router()

router.use(authMiddleware)

/**
 * @openapi
 * /documents/mine:
 *   get:
 *     tags: [Documents]
 *     summary: 获取当前用户的文档列表
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: 按项目ID筛选
 *     responses:
 *       200:
 *         description: 成功获取文档列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: 未授权
 */
// 客户获取自己的文档列表
router.get('/mine', async (req, res, next) => {
    try {
        const documents = await documentService.getMyDocuments(req.user!.id, req.query.projectId as string)
        sendSuccess(res, documents)
    } catch (error) {
        next(error)
    }
})

// 下载文档 - 含权限校验
router.get('/:id/download', async (req, res, next) => {
    try {
        const doc = await documentService.getDocumentById(req.params.id)
        if (!doc) {
            throw new NotFoundError('文档不存在')
        }

        const userId = req.user!.id
        const userRole = req.user!.role

        // 权限检查
        if (doc.accessLevel === 'PRIVATE') {
            // 仅上传者和管理员可访问
            if (doc.uploadedById !== userId && userRole !== 'ADMIN') {
                throw new ForbiddenError('无权访问此文档')
            }
        } else if (doc.accessLevel === 'TEAM') {
            // 检查是否同项目成员（通过项目关联检查）
            if (userRole !== 'ADMIN' && doc.projectId) {
                const project = await prisma.project.findFirst({
                    where: {
                        id: doc.projectId,
                        OR: [
                            // 是项目的客户
                            { customer: { userId } },
                            // 是项目相关任务的负责人
                            { tasks: { some: { assignedToId: userId } } },
                        ],
                    },
                })
                if (!project) {
                    throw new ForbiddenError('无权访问此文档')
                }
            }
        }
        // PUBLIC 级别所有登录用户可访问

        // 检查文件是否存在
        if (!fs.existsSync(doc.filePath)) {
            if (doc.filePath === '#') {
                throw new NotFoundError('演示文件不可下载')
            }
            throw new NotFoundError('文件在服务器上不存在')
        }

        const resolvedPath = path.resolve(doc.filePath)
        const uploadsRoot = path.resolve('uploads/')
        if (!resolvedPath.startsWith(uploadsRoot + path.sep) && resolvedPath !== uploadsRoot) {
            throw new ForbiddenError('非法文件路径')
        }

        res.download(doc.filePath, doc.fileName)
    } catch (error) {
        next(error)
    }
})

/**
 * @openapi
 * /documents/upload:
 *   post:
 *     tags: [Documents]
 *     summary: 上传文档
 *     description: 上传文档到指定项目，单文件最大 5MB，用户总存储限额 100MB
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               projectId:
 *                 type: string
 *     responses:
 *       200:
 *         description: 上传成功
 *       401:
 *         description: 未授权
 *       413:
 *         description: 存储空间不足或文件过大
 */
// 上传文档 - 含项目归属校验
router.post('/upload', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return sendError(res, 'No file uploaded', 400)
        }

        const { projectId } = req.body
        const userId = req.user!.id
        const userRole = req.user!.role

        // 检查用户总存储空间（100MB 限额）
        const MAX_TOTAL_STORAGE = 100 * 1024 * 1024 // 100MB
        const usedStorage = await prisma.document.aggregate({
            where: { uploadedById: userId },
            _sum: { fileSize: true },
        })
        const currentUsage = usedStorage._sum.fileSize || 0
        if (currentUsage + req.file.size > MAX_TOTAL_STORAGE) {
            // 清理已上传的文件
            fs.unlinkSync(req.file.path)
            return sendError(res, `存储空间不足。已使用 ${(currentUsage / 1024 / 1024).toFixed(1)}MB / 100MB，无法上传 ${(req.file.size / 1024 / 1024).toFixed(1)}MB 的文件`, 413)
        }

        // 如果指定了 projectId，校验项目归属权限（管理员跳过）
        if (projectId && userRole !== 'ADMIN') {
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    OR: [
                        { customer: { userId } },
                        { tasks: { some: { assignedToId: userId } } },
                    ],
                },
            })
            if (!project) {
                throw new ForbiddenError('无权向此项目上传文档')
            }
        }

        const doc = await documentService.uploadDocument({
            projectId: projectId || null,
            fileName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            fileType: req.file.mimetype,
            uploadedById: userId,
            accessLevel: 'TEAM' // 默认团队可见
        })

        sendSuccess(res, doc)
    } catch (error) {
        next(error)
    }
})

export default router
