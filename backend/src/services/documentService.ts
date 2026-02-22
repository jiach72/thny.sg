import { prisma } from '../config/index.js'

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
                accessLevel: { in: ['PUBLIC', 'TEAM'] } // 门户可见级别
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
        // 验证项目是否存在且用户有权限
        // 对于客户，只能上传到自己的项目
        // 简化起见，这里假设 Controller 层或 Middleware 已经做了基本校验，
        // 或者在这里查一下 Project 的 customerId/ownerId。
        // 但 MVP 阶段先直接写入。

        return prisma.document.create({
            data: {
                projectId: data.projectId,
                fileName: data.fileName,
                filePath: data.filePath,
                fileType: data.fileType,
                fileSize: data.fileSize,
                uploadedById: data.uploadedById,
                accessLevel: (data.accessLevel as any) || 'private', // default
                documentType: 'UPLOAD'
            }
        })
    },

    /**
     * 获取文档详情（用于下载）
     */
    async getDocumentById(id: string) {
        return prisma.document.findUnique({
            where: { id }
        })
    }
}
