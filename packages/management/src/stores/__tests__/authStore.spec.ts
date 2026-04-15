import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../authStore'

// Mock API 模块
vi.mock('@/api', () => ({
  authApi: {
    login: vi.fn(),
    refreshToken: vi.fn(),
    getCurrentUser: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
  },
}))

vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

import { authApi, apiClient } from '@/api'

describe('authStore (Management)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('应成功登录管理员账号', async () => {
      const mockResponse = {
        accessToken: 'test-token',
        user: { id: '1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      }
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any)
      vi.mocked(apiClient.get).mockResolvedValue(['*'])

      const store = useAuthStore()
      const result = await store.login({ email: 'admin@test.com', password: 'pass' })

      expect(result.accessToken).toBe('test-token')
      expect(store.isAuthenticated).toBe(true)
      expect(store.user?.role).toBe('ADMIN')
    })

    it('应拒绝客户账号登录', async () => {
      const mockResponse = {
        accessToken: 'test-token',
        user: { id: '1', name: 'Customer', email: 'c@test.com', role: 'CUSTOMER' },
      }
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any)

      const store = useAuthStore()
      await expect(store.login({ email: 'c@test.com', password: 'pass' })).rejects.toThrow('客户账号无法登录管理系统')
    })
  })

  describe('logout', () => {
    it('应清空认证状态', async () => {
      const mockResponse = {
        accessToken: 'test-token',
        user: { id: '1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      }
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any)
      vi.mocked(apiClient.get).mockResolvedValue(['*'])

      const store = useAuthStore()
      await store.login({ email: 'admin@test.com', password: 'pass' })
      store.logout()

      expect(store.accessToken).toBeNull()
      expect(store.user).toBeNull()
      expect(store.permissions).toEqual([])
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('can', () => {
    it('ADMIN 角色应拥有所有权限', async () => {
      const mockResponse = {
        accessToken: 'test-token',
        user: { id: '1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      }
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any)
      vi.mocked(apiClient.get).mockResolvedValue(['*'])

      const store = useAuthStore()
      await store.login({ email: 'admin@test.com', password: 'pass' })
      await store.fetchPermissions()

      expect(store.can('any:permission')).toBe(true)
      expect(store.can('users:create')).toBe(true)
    })

    it('非管理员应按权限列表判断', async () => {
      const mockResponse = {
        accessToken: 'test-token',
        user: { id: '2', name: 'Manager', email: 'mgr@test.com', role: 'MANAGER' },
      }
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any)
      vi.mocked(apiClient.get).mockResolvedValue(['leads:read', 'leads:write'])

      const store = useAuthStore()
      await store.login({ email: 'mgr@test.com', password: 'pass' })

      expect(store.can('leads:read')).toBe(true)
      expect(store.can('admin:delete')).toBe(false)
    })
  })

  describe('computed properties', () => {
    it('isAdmin 应正确判断', async () => {
      const mockResponse = {
        accessToken: 'test-token',
        user: { id: '1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      }
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any)
      vi.mocked(apiClient.get).mockResolvedValue(['*'])

      const store = useAuthStore()
      await store.login({ email: 'admin@test.com', password: 'pass' })
      expect(store.isAdmin).toBe(true)
    })

    it('isManager 应对 MANAGER 角色返回 true', async () => {
      const mockResponse = {
        accessToken: 'test-token',
        user: { id: '2', name: 'Manager', email: 'mgr@test.com', role: 'MANAGER' },
      }
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any)
      vi.mocked(apiClient.get).mockResolvedValue(['leads:read'])

      const store = useAuthStore()
      await store.login({ email: 'mgr@test.com', password: 'pass' })
      expect(store.isManager).toBe(true)
    })
  })
})
