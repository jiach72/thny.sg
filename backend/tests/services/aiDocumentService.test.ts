import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    project: {
        findUnique: vi.fn(),
    },
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

import { aiDocumentService } from '../../src/services/aiDocumentService'

describe('AiDocumentService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getDocumentChecklist', () => {
        it('should return EP visa document requirements', async () => {
            const checklist = await aiDocumentService.getDocumentChecklist('EP')

            expect(checklist).toContain('护照')
            expect(checklist).toContain('学历证明')
            expect(checklist).toContain('雇佣合同')
            expect(checklist.length).toBe(5)
        })

        it('should return PR visa document requirements', async () => {
            const checklist = await aiDocumentService.getDocumentChecklist('PR')

            expect(checklist).toContain('护照')
            expect(checklist).toContain('出生证明')
            expect(checklist.length).toBe(7)
        })

        it('should return DP visa document requirements', async () => {
            const checklist = await aiDocumentService.getDocumentChecklist('DP')

            expect(checklist).toContain('护照')
            expect(checklist).toContain('婚姻证明')
            expect(checklist.length).toBe(4)
        })

        it('should return LTVP visa document requirements', async () => {
            const checklist = await aiDocumentService.getDocumentChecklist('LTVP')

            expect(checklist).toContain('护照')
            expect(checklist.length).toBe(4)
        })

        it('should return empty array for unknown project type', async () => {
            const checklist = await aiDocumentService.getDocumentChecklist('UNKNOWN')

            expect(checklist).toEqual([])
        })
    })

    describe('checkDocumentCompleteness', () => {
        it('should throw error if project not found', async () => {
            prismaMock.project.findUnique.mockResolvedValue(null)

            await expect(
                aiDocumentService.checkDocumentCompleteness('proj-nonexistent')
            ).rejects.toThrow('项目不存在')
        })

        it('should identify missing documents', async () => {
            prismaMock.project.findUnique.mockResolvedValue({
                id: 'proj-1',
                projectType: 'EP',
                documents: [
                    { fileName: '护照扫描件.pdf' },
                ],
            })

            const result = await aiDocumentService.checkDocumentCompleteness('proj-1')

            expect(result.total).toBe(5)
            expect(result.missing.length).toBeGreaterThan(0)
            expect(result.uploaded).toContain('护照')
        })

        it('should return all documents as missing if none uploaded', async () => {
            prismaMock.project.findUnique.mockResolvedValue({
                id: 'proj-1',
                projectType: 'EP',
                documents: [],
            })

            const result = await aiDocumentService.checkDocumentCompleteness('proj-1')

            expect(result.total).toBe(5)
            expect(result.missing.length).toBe(5)
            expect(result.uploaded.length).toBe(0)
        })

        it('should return all documents as uploaded if all present', async () => {
            prismaMock.project.findUnique.mockResolvedValue({
                id: 'proj-1',
                projectType: 'EP',
                documents: [
                    { fileName: '护照.pdf' },
                    { fileName: '学历证明.pdf' },
                    { fileName: '雇佣合同.pdf' },
                    { fileName: '薪资证明.pdf' },
                    { fileName: '公司支持信.pdf' },
                ],
            })

            const result = await aiDocumentService.checkDocumentCompleteness('proj-1')

            expect(result.total).toBe(5)
            expect(result.uploaded.length).toBe(5)
            expect(result.missing.length).toBe(0)
        })

        it('should handle unknown project type with empty requirements', async () => {
            prismaMock.project.findUnique.mockResolvedValue({
                id: 'proj-1',
                projectType: 'UNKNOWN',
                documents: [],
            })

            const result = await aiDocumentService.checkDocumentCompleteness('proj-1')

            expect(result.total).toBe(0)
            expect(result.missing).toEqual([])
            expect(result.uploaded).toEqual([])
        })
    })
})
