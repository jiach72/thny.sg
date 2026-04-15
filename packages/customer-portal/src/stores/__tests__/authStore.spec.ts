import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../authStore'

vi.mock('@/api', () => ({
  authApi: {
    login: vi.fn(),
    refreshToken: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}))

import { authApi } from '@/api'

describe('authStore (Customer Portal)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('应成功登录客户账号', async () => {
      const mockResponse = {
        accessToken: 'test-token',
        user: { id: '1', name: 'Customer', email: 'c@test.com', role: 'CUSTOMER' },
      }
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any)

      const store = useAuthStore()
      await store.login({ email: 'c@test.com', password: 'pass' })

      expect(store.isAuthenticated).toBe(true)
      expect(store.isCustomer).toBe(true)
      expect(store.accessToken).toBe('test-token')
    })

    it('应拒绝非客户账号登录', async () => {
      const mockResponse = {
        accessToken: 'test-token',
        user: { id: '1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      }
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any)

      const store = useAuthStore()
      await expect(store.login({ email: 'admin@test.com', password: 'pass' })).rejects.toThrow('此门户仅限客户访问')
    })
  })

  describe('logout', () => {
    it('应清空认证状态', async () => {
      const mockResponse = {
        accessToken: 'test-token',
        user: { id: '1', name: 'Customer', email: 'c@test.com', role: 'CUSTOMER' },
      }
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any)

      const store = useAuthStore()
      await store.login({ email: 'c@test.com', password: 'pass' })
      store.logout()

      expect(store.accessToken).toBeNull()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('fetchCurrentUser', () => {
    it('应获取并设置当前客户用户', async () => {
      const mockUser = { id: '1', name: 'Customer', email: 'c@test.com', role: 'CUSTOMER' }
      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser as any)

      const store = useAuthStore()
      store.setTokens('test-token')
      const result = await store.fetchCurrentUser()

      expect(result?.role).toBe('CUSTOMER')
      expect(store.user?.role).toBe('CUSTOMER')
    })

    it('应在非客户角色时登出', async () => {
      const mockUser = { id: '1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' }
      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser as any)

      const store = useAuthStore()
      store.setTokens('test-token')
      const result = await store.fetchCurrentUser()

      expect(result).toBeNull()
      expect(store.user).toBeNull()
    })

    it('在无 token 时应返回 null', async () => {
      const store = useAuthStore()
      const result = await store.fetchCurrentUser()
      expect(result).toBeNull()
    })
  })

  describe('setTokens / setUser', () => {
    it('应设置 accessToken', () => {
      const store = useAuthStore()
      store.setTokens('new-token')
      expect(store.accessToken).toBe('new-token')
    })

    it('应设置 user', () => {
      const store = useAuthStore()
      store.setUser({ id: '1', name: 'Test', email: 't@t.com', role: 'CUSTOMER' } as any)
      expect(store.user?.name).toBe('Test')
      expect(store.isCustomer).toBe(true)
    })
  })
})
