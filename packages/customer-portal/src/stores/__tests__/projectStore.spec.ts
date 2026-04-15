import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProjectStore } from '../projectStore'

vi.mock('@/api', () => ({
  portalApi: {
    getMyProjects: vi.fn(),
    getProjectById: vi.fn(),
  },
}))

vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

import { portalApi } from '@/api'

describe('projectStore (Customer Portal)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchMyProjects', () => {
    it('应获取项目列表并更新状态', async () => {
      const mockProjects = [
        { id: '1', name: 'Project Alpha', status: 'ACTIVE' },
        { id: '2', name: 'Project Beta', status: 'COMPLETED' },
      ]
      vi.mocked(portalApi.getMyProjects).mockResolvedValue(mockProjects as any)

      const store = useProjectStore()
      await store.fetchMyProjects()

      expect(store.projects).toHaveLength(2)
      expect(store.projects[0].title).toBe('Project Alpha')
      expect(store.isLoading).toBe(false)
    })

    it('应在 API 失败时保持空列表', async () => {
      vi.mocked(portalApi.getMyProjects).mockRejectedValue(new Error('Network error'))

      const store = useProjectStore()
      await store.fetchMyProjects()

      expect(store.projects).toEqual([])
      expect(store.isLoading).toBe(false)
    })

    it('应在返回 null 时设置空列表', async () => {
      vi.mocked(portalApi.getMyProjects).mockResolvedValue(null as any)

      const store = useProjectStore()
      await store.fetchMyProjects()

      expect(store.projects).toEqual([])
    })
  })

  describe('fetchProject', () => {
    it('应获取单个项目并设置为 currentProject', async () => {
      const mockProject = { id: '1', name: 'Project Alpha', status: 'ACTIVE' }
      vi.mocked(portalApi.getProjectById).mockResolvedValue(mockProject as any)

      const store = useProjectStore()
      await store.fetchProject('1')

      expect(store.currentProject?.id).toBe('1')
      expect(store.currentProject?.title).toBe('Project Alpha')
      expect(store.isLoading).toBe(false)
    })

    it('应在 API 失败时保持 currentProject 为 null', async () => {
      vi.mocked(portalApi.getProjectById).mockRejectedValue(new Error('Not found'))

      const store = useProjectStore()
      await store.fetchProject('999')

      expect(store.currentProject).toBeNull()
      expect(store.isLoading).toBe(false)
    })
  })
})
