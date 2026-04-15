import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1. 提升 mock 对象
const prismaMock = vi.hoisted(() => ({
    project: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
}))

// 2. Mock 模块
vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

// Mock webhookService
vi.mock('../../src/services/webhookService.js', () => ({
    webhookService: { emit: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

// 3. 导入被测模块
import { projectService } from '../../src/services/projectService.js'

describe('projectService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getProjects', () => {
        it('应该能够带过滤条件分页取回项目数组', async () => {
            prismaMock.project.count.mockResolvedValue(5)
            prismaMock.project.findMany.mockResolvedValue([
                { id: 'p1', status: 'ACTIVE' },
                { id: 'p2', status: 'ACTIVE' }
            ])

            const res = await projectService.getProjects({ page: 1, limit: 10, status: 'ACTIVE' })

            expect(res.data).toHaveLength(2)
            expect(res.pagination.total).toBe(5)
            expect(prismaMock.project.count).toHaveBeenCalledWith(expect.objectContaining({
                where: { status: 'ACTIVE' }
            }))
        })
    })

    describe('getMyProjectById', () => {
        it('应该只允许指定客户获取属于自己邮箱名下的项目', async () => {
            const mockProject = { id: 'p1', title: 'Test Project' }
            prismaMock.project.findFirst.mockResolvedValue(mockProject)

            const res = await projectService.getMyProjectById('p1', 'client@test.com')

            expect(res?.title).toBe('Test Project')
            expect(prismaMock.project.findFirst).toHaveBeenCalledWith(expect.objectContaining({
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
            prismaMock.project.create.mockResolvedValue({ ...payload, id: 'x1' })

            const res = await projectService.createProject(payload)
            expect(res.id).toBe('x1')
            expect(prismaMock.project.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ title: 'New Biz', status: 'PLANNING' })
            }))
        })
    })
})
