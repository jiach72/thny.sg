import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    document: {
        findUnique: vi.fn(),
    },
    signatureRequest: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
    },
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

import { signatureService } from '../../src/services/signatureService'

describe('SignatureService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createSigningRequest', () => {
        it('should create a signing request for existing document', async () => {
            prismaMock.document.findUnique.mockResolvedValue({
                id: 'doc-1',
                fileName: '雇佣合同.pdf',
            })
            prismaMock.signatureRequest.create.mockResolvedValue({
                id: 'sig-1',
                documentId: 'doc-1',
                projectId: 'proj-1',
                title: '签署: 雇佣合同.pdf',
                status: 'SENT',
                signers: [{ email: 'signer@example.com', status: 'PENDING', signedAt: null }],
            })

            const result = await signatureService.createSigningRequest(
                'doc-1',
                'proj-1',
                'signer@example.com'
            )

            expect(result.id).toBe('sig-1')
            expect(result.status).toBe('SENT')
            expect(prismaMock.signatureRequest.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        documentId: 'doc-1',
                        projectId: 'proj-1',
                        status: 'SENT',
                    }),
                })
            )
        })

        it('should throw error if document not found', async () => {
            prismaMock.document.findUnique.mockResolvedValue(null)

            await expect(
                signatureService.createSigningRequest('doc-nonexistent', 'proj-1', 'signer@example.com')
            ).rejects.toThrow('文档不存在')
        })
    })

    describe('completeSigning', () => {
        it('should complete a signing request', async () => {
            prismaMock.signatureRequest.findUnique.mockResolvedValue({
                id: 'sig-1',
                status: 'SENT',
                signers: [{ email: 'signer@example.com', status: 'PENDING', signedAt: null }],
            })
            prismaMock.signatureRequest.update.mockResolvedValue({
                id: 'sig-1',
                status: 'COMPLETED',
                signatureUrl: 'data:image/png;base64,signature',
                signedAt: expect.any(Date),
                completedAt: expect.any(Date),
            })

            const result = await signatureService.completeSigning(
                'sig-1',
                'data:image/png;base64,signature'
            )

            expect(prismaMock.signatureRequest.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'sig-1' },
                    data: expect.objectContaining({
                        status: 'COMPLETED',
                        signatureUrl: 'data:image/png;base64,signature',
                    }),
                })
            )
        })

        it('should throw error if signing request not found', async () => {
            prismaMock.signatureRequest.findUnique.mockResolvedValue(null)

            await expect(
                signatureService.completeSigning('sig-nonexistent', 'data:signature')
            ).rejects.toThrow('签名请求不存在')
        })
    })

    describe('getSigningRequests', () => {
        it('should return signing requests for a project', async () => {
            const mockRequests = [
                { id: 'sig-1', status: 'SENT', document: { id: 'doc-1', fileName: '合同.pdf' } },
                { id: 'sig-2', status: 'COMPLETED', document: { id: 'doc-2', fileName: '协议.pdf' } },
            ]
            prismaMock.signatureRequest.findMany.mockResolvedValue(mockRequests)

            const result = await signatureService.getSigningRequests('proj-1')

            expect(result).toHaveLength(2)
            expect(prismaMock.signatureRequest.findMany).toHaveBeenCalledWith({
                where: { projectId: 'proj-1' },
                include: { document: true },
                orderBy: { createdAt: 'desc' },
            })
        })
    })
})
