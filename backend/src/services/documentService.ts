import { prisma } from '../config/index.js'
import { NotFoundError } from '../middlewares/errorHandler.js'

export const documentService = {
    /**
     * 获取当前用户的文档
     */
    async getMyDocuments(userId: string, projectId?: string) {
        // 查找用户关联的 Customer
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) return []

        return prisma.document.findMany({
            where: {
                projectId: projectId || undefined,
                project: {
                    customer: {
                        lead: {
                            email: user.email
                        }
                    }
                },
                accessLevel: { in: ['PUBLIC', 'TEAM'] }, // 门户可见级别
                deletedAt: null
            },
            include: {
                project: { select: { title: true } },
                uploadedBy: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
    },

    /**
     * 上传文档
     */
    async uploadDocument(data: {
        projectId: string | null
        fileName: string
        filePath: string
        fileType: string
        fileSize: number
        uploadedById: string
        accessLevel?: 'PRIVATE' | 'TEAM' | 'PUBLIC'
    }) {
        // 验证项目存在且上传者有权限
        if (data.projectId) {
            const project = await prisma.project.findUnique({
                where: { id: data.projectId, deletedAt: null },
            })
            if (!project) {
                throw new NotFoundError('项目不存在')
            }
        }

        // 验证上传者存在
        const uploader = await prisma.user.findUnique({
            where: { id: data.uploadedById },
        })
        if (!uploader) {
            throw new NotFoundError('上传者不存在')
        }

        return prisma.document.create({
            data: {
                projectId: data.projectId,
                fileName: data.fileName,
                filePath: data.filePath,
                fileType: data.fileType,
                fileSize: data.fileSize,
                uploadedById: data.uploadedById,
                accessLevel: data.accessLevel || 'PRIVATE',
                documentType: 'UPLOAD'
            }
        })
    },

    /**
     * 获取文档详情（用于下载）
     */
    async getDocumentById(id: string) {
        return prisma.document.findUnique({
            where: { id, deletedAt: null }
        })
    },

    /**
     * 软删除文档
     */
    async deleteDocument(id: string) {
        return prisma.document.update({
            where: { id },
            data: { deletedAt: new Date() }
        })
    }
}
