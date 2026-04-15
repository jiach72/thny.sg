import { prisma } from '../config/index.js'
import { NotFoundError } from '../middlewares/index.js'

interface DocumentCheckResult {
    missing: string[]
    uploaded: string[]
    total: number
}

export const aiDocumentService = {
    visaDocumentRequirements: {
        EP: ['护照', '学历证明', '雇佣合同', '薪资证明', '公司支持信'],
        PR: ['护照', '出生证明', '婚姻证明', '学历证明', '工作证明', '税单', '薪资证明'],
        DP: ['护照', '婚姻证明', '出生证明', '主申请人准证'],
        LTVP: ['护照', '婚姻证明', '主申请人准证', '收入证明'],
    } as Record<string, string[]>,

    async checkDocumentCompleteness(projectId: string): Promise<DocumentCheckResult> {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { documents: true },
        })

        if (!project) {
            throw new NotFoundError('项目不存在')
        }

        const requiredDocs = this.visaDocumentRequirements[project.projectType] || []
        const uploadedDocNames = project.documents.map((d) =>
            d.fileName.toLowerCase()
        )

        const missing = requiredDocs.filter(
            (req) =>
                !uploadedDocNames.some((up) =>
                    up.includes(req.toLowerCase().substring(0, 2))
                )
        )
        const uploaded = requiredDocs.filter((req) =>
            uploadedDocNames.some((up) =>
                up.includes(req.toLowerCase().substring(0, 2))
            )
        )

        return { missing, uploaded, total: requiredDocs.length }
    },

    async getDocumentChecklist(projectType: string): Promise<string[]> {
        return this.visaDocumentRequirements[projectType] || []
    },
}

export default aiDocumentService
