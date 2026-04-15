import { prisma } from '../config/index.js'
import { Prisma } from '@prisma/client'
import { NotFoundError } from '../middlewares/index.js'
import logger from '../config/logger.js'

export const signatureService = {
    async createSigningRequest(documentId: string, projectId: string, signerEmail: string) {
        const document = await prisma.document.findUnique({
            where: { id: documentId },
        })

        if (!document) {
            throw new NotFoundError('文档不存在')
        }

        const signatureRequest = await prisma.signatureRequest.create({
            data: {
                documentId,
                projectId,
                title: `签署: ${document.fileName}`,
                status: 'SENT',
                signers: [{ email: signerEmail, status: 'PENDING', signedAt: null }],
            },
        })

        logger.info('创建签名请求', {
            documentId,
            projectId,
            requestId: signatureRequest.id,
        })

        return signatureRequest
    },

    async completeSigning(requestId: string, signatureData: string) {
        const request = await prisma.signatureRequest.findUnique({
            where: { id: requestId },
        })

        if (!request) {
            throw new NotFoundError('签名请求不存在')
        }

        return prisma.signatureRequest.update({
            where: { id: requestId },
            data: {
                status: 'COMPLETED',
                signatureUrl: signatureData,
                signedAt: new Date(),
                completedAt: new Date(),
                signers: (request.signers as Array<Record<string, unknown>>).map((s) =>
                    s.email ? { ...s, status: 'SIGNED', signedAt: new Date().toISOString() } : s
                ) as unknown as Prisma.InputJsonValue,
            },
        })
    },

    async getSigningRequests(projectId: string) {
        return prisma.signatureRequest.findMany({
            where: { projectId },
            include: { document: true },
            orderBy: { createdAt: 'desc' },
        })
    },
}

export default signatureService
