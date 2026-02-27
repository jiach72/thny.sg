import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import { PrismaClient } from '@prisma/client'
import { documentService } from '../../src/services/documentService.js'

vi.mock('../../src/config/index.js', () => ({
    prisma: mockDeep<PrismaClient>()
}))
import { prisma } from '../../src/config/index.js'

describe('documentService', () => {
    beforeEach(() => {
        mockReset(prisma)
    })

    describe('getMyDocuments', () => {
        it('应该仅带回自己项目下访问级别为公开或者团队的文档列表', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', email: 'test@t.com' } as any)
            vi.mocked(prisma.document.findMany).mockResolvedValue([
                { id: 'doc1', accessLevel: 'PUBLIC' },
                { id: 'doc2', accessLevel: 'TEAM' }
            ] as any)

            const docs = await documentService.getMyDocuments('u1', 'p1')

            expect(docs).toHaveLength(2)
            expect(prisma.document.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    projectId: 'p1',
                    accessLevel: { in: ['PUBLIC', 'TEAM'] }
                })
            }))
        })

        it('当用户不存在时应返回空列表保护应用', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
            const docs = await documentService.getMyDocuments('invalid_u')
            expect(docs).toHaveLength(0)
            expect(prisma.document.findMany).not.toHaveBeenCalled()
        })
    })

    describe('uploadDocument', () => {
        it('应该利用默认或指定的权限级别产生新文档记录', async () => {
            const payload = {
                projectId: 'p1',
                fileName: 'contract.pdf',
                filePath: '/path',
                fileType: 'pdf',
                fileSize: 1024,
                uploadedById: 'admin',
                accessLevel: 'PRIVATE' as const
            }

            vi.mocked(prisma.document.create).mockResolvedValue({ id: 'docX', ...payload } as any)

            const res = await documentService.uploadDocument(payload)
            expect(res.id).toBe('docX')
            expect(prisma.document.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    accessLevel: 'PRIVATE',
                    documentType: 'UPLOAD'
                })
            }))
        })
    })
})
