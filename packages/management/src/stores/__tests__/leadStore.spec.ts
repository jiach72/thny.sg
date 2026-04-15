import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLeadStore } from '../leadStore'

vi.mock('@/api', () => ({
  leadApi: {
    getList: vi.fn(),
    getStats: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    convertToCustomer: vi.fn(),
    getActivities: vi.fn(),
    checkDuplicates: vi.fn(),
    assign: vi.fn(),
    addNote: vi.fn(),
  },
}))

import { leadApi } from '@/api'

describe('leadStore (Management)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchLeads', () => {
    it('应获取线索列表并更新状态', async () => {
      const mockResult = {
        data: [
          { id: '1', name: 'Lead 1', status: 'NEW' },
          { id: '2', name: 'Lead 2', status: 'CONTACTED' },
        ],
        pagination: { total: 2, page: 1, limit: 20 },
      }
      vi.mocked(leadApi.getList).mockResolvedValue(mockResult as any)

      const store = useLeadStore()
      await store.fetchLeads()

      expect(store.leads).toHaveLength(2)
      expect(store.total).toBe(2)
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchLeadById', () => {
    it('应获取单个线索并设置为 currentLead', async () => {
      const mockLead = { id: '1', name: 'Test Lead', status: 'NEW' }
      vi.mocked(leadApi.getById).mockResolvedValue(mockLead as any)

      const store = useLeadStore()
      await store.fetchLeadById('1')

      expect(store.currentLead?.id).toBe('1')
    })
  })

  describe('createLead', () => {
    it('应创建线索并添加到列表', async () => {
      const newLead = { id: '3', name: 'New Lead', status: 'NEW' }
      vi.mocked(leadApi.create).mockResolvedValue(newLead as any)

      const store = useLeadStore()
      await store.createLead({ name: 'New Lead' } as any)

      expect(store.leads).toHaveLength(1)
      expect(store.leads[0].id).toBe('3')
      expect(store.total).toBe(1)
    })
  })

  describe('deleteLead', () => {
    it('应删除线索并从列表移除', async () => {
      vi.mocked(leadApi.delete).mockResolvedValue(undefined as any)
      vi.mocked(leadApi.getList).mockResolvedValue({
        data: [{ id: '1', name: 'Lead 1', status: 'NEW' }],
        pagination: { total: 1, page: 1, limit: 20 },
      } as any)

      const store = useLeadStore()
      await store.fetchLeads()
      await store.deleteLead('1')

      expect(store.leads).toHaveLength(0)
    })
  })

  describe('convertToCustomer', () => {
    it('应将线索状态更新为 CONVERTED', async () => {
      vi.mocked(leadApi.getList).mockResolvedValue({
        data: [{ id: '1', name: 'Lead 1', status: 'NEW' }],
        pagination: { total: 1, page: 1, limit: 20 },
      } as any)
      vi.mocked(leadApi.convertToCustomer).mockResolvedValue({ customerId: 'c1' } as any)

      const store = useLeadStore()
      await store.fetchLeads()
      await store.convertToCustomer('1')

      expect(store.leads[0].status).toBe('CONVERTED')
    })
  })

  describe('setFilters / setPage', () => {
    it('应设置筛选条件并重置页码', () => {
      const store = useLeadStore()
      store.setFilters({ status: 'NEW' } as any)
      expect(store.filters).toEqual({ status: 'NEW' })
      expect(store.page).toBe(1)
    })

    it('应设置页码', () => {
      const store = useLeadStore()
      store.setPage(3)
      expect(store.page).toBe(3)
    })
  })

  describe('totalPages', () => {
    it('应正确计算总页数', () => {
      const store = useLeadStore()
      store.$patch({ total: 45, limit: 20 } as any)
      expect(store.totalPages).toBe(3)
    })
  })
})
