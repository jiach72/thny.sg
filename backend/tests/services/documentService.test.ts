import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1. 提升 mock 对象
const prismaMock = vi.hoisted(() => ({
    user: {
        findUnique: vi.fn(),
    },
    document: {
        findMany: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
    },
    project: {
        findUnique: vi.fn(),
    },
}))

// 2. Mock 模块
vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

// 3. 导入被测模块
import { documentService } from '../../src/services/documentService.js'

describe('documentService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getMyDocuments', () => {
        it('应该仅带回自己项目下访问级别为公开或者团队的文档列表', async () => {
            prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', email: 'test@t.com' })
            prismaMock.document.findMany.mockResolvedValue([
                { id: 'doc1', accessLevel: 'PUBLIC' },
                { id: 'doc2', accessLevel: 'TEAM' }
            ])

            const docs = await documentService.getMyDocuments('u1', 'p1')

            expect(docs).toHaveLength(2)
            expect(prismaMock.document.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    projectId: 'p1',
                    accessLevel: { in: ['PUBLIC', 'TEAM'] }
                })
            }))
        })

        it('当用户不存在时应返回空列表保护应用', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null)
            const docs = await documentService.getMyDocuments('invalid_u')
            expect(docs).toHaveLength(0)
            expect(prismaMock.document.findMany).not.toHaveBeenCalled()
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

            prismaMock.project.findUnique.mockResolvedValue({ id: 'p1' })
            prismaMock.user.findUnique.mockResolvedValue({ id: 'admin' })
            prismaMock.document.create.mockResolvedValue({ id: 'docX', ...payload })

            const res = await documentService.uploadDocument(payload)
            expect(res.id).toBe('docX')
            expect(prismaMock.document.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    accessLevel: 'PRIVATE',
                    documentType: 'UPLOAD'
                })
            }))
        })
    })
})
