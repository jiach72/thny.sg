import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { authMiddleware } from '../middlewares/index.js'
import { documentService } from '../services/documentService.js'

// 配置 Multer 存储
const uploadDir = 'uploads/'
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // 防止文件名冲突，添加时间戳
        // 并保留原始后缀
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    },
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

const router = Router()

router.use(authMiddleware)

// 客户获取自己的文档列表
router.get('/mine', async (req, res, next) => {
    try {
        const documents = await documentService.getMyDocuments(req.user!.id, req.query.projectId as string)
        res.json(documents)
    } catch (error) {
        next(error)
    }
})

// 下载文档
router.get('/:id/download', async (req, res, next) => {
    try {
        const doc = await documentService.getDocumentById(req.params.id)
        if (!doc) {
            return res.status(404).json({ message: 'Document not found' })
        }

        // TODO: 校验用户权限
        // const hasPermission = await documentService.checkPermission(req.user!.id, doc)

        // 检查文件是否存在
        if (!fs.existsSync(doc.filePath)) {
            // 如果是演示数据 (#)，返回 404
            if (doc.filePath === '#') {
                return res.status(404).json({ message: 'Demo file not available on disk' })
            }
            return res.status(404).json({ message: 'File not found on server' })
        }

        // 设置 Content-Disposition
        res.download(doc.filePath, doc.fileName)
    } catch (error) {
        next(error)
    }
})

// 上传文档
router.post('/upload', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' })
        }

        const { projectId } = req.body
        if (!projectId) {
            return res.status(400).json({ message: 'projectId is required' })
        }

        // TODO: 校验 projectId 是否属于当前用户 (或在 service 层校验)
        // const isOwner = await projectService.verifyOwner(projectId, req.user!.id)

        const doc = await documentService.uploadDocument({
            projectId,
            fileName: req.file.originalname, // 使用原始文件名方便识别
            filePath: req.file.path,
            fileSize: req.file.size,
            fileType: req.file.mimetype,
            uploadedById: req.user!.id,
            accessLevel: 'TEAM' // 默认团队可见
        })

        res.json(doc)
    } catch (error) {
        next(error)
    }
})

export default router
