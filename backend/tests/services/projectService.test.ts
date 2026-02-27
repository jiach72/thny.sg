import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import { PrismaClient } from '@prisma/client'
import { projectService } from '../../src/services/projectService.js'

vi.mock('../../src/config/index.js', () => ({
    prisma: mockDeep<PrismaClient>()
}))
import { prisma } from '../../src/config/index.js'

describe('projectService', () => {
    beforeEach(() => {
        mockReset(prisma)
    })

    describe('getProjects', () => {
        it('应该能够带过滤条件分页取回项目数组', async () => {
            vi.mocked(prisma.project.count).mockResolvedValue(5)
            vi.mocked(prisma.project.findMany).mockResolvedValue([
                { id: 'p1', status: 'ACTIVE' },
                { id: 'p2', status: 'ACTIVE' }
            ] as any)

            const res = await projectService.getProjects({ page: 1, limit: 10, status: 'ACTIVE' })

            expect(res.data).toHaveLength(2)
            expect(res.pagination.total).toBe(5)
            expect(prisma.project.count).toHaveBeenCalledWith(expect.objectContaining({
                where: { status: 'ACTIVE' }
            }))
        })
    })

    describe('getMyProjectById', () => {
        it('应该只允许指定客户获取属于自己邮箱名下的项目', async () => {
            const mockProject = { id: 'p1', title: 'Test Project' }
            vi.mocked(prisma.project.findFirst).mockResolvedValue(mockProject as any)

            const res = await projectService.getMyProjectById('p1', 'client@test.com')

            expect(res?.title).toBe('Test Project')
            expect(prisma.project.findFirst).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    id: 'p1',
                    customer: { lead: { email: 'client@test.com' } }
                }
            }))
        })
    })

    describe('createProject', () => {
        it('应该初始化创建一个类型正确的项目计划', async () => {
            const payload = {
                title: 'New Biz',
                customerId: 'c1',
                projectType: 'accounting',
                budget: 1000
            }
            vi.mocked(prisma.project.create).mockResolvedValue({ ...payload, id: 'x1' } as any)

            const res = await projectService.createProject(payload)
            expect(res.id).toBe('x1')
            expect(prisma.project.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ title: 'New Biz', status: 'PLANNING' })
            }))
        })
    })
})
