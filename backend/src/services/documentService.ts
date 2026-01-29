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
    }
}
