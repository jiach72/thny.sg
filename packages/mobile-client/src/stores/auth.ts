/**
 * Pinia Auth Store — 跨端鉴权中枢
 * 管理 Token 生命周期、用户状态、登录/登出
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import http from '../utils/request'
import { setSecureItem, removeSecureItem } from '../utils/secureStorage'
import { setCachedAccessToken } from '../utils/request'
import type { User } from '@tonghai/shared'

interface LoginParams {
  email: string
  password: string
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
  requires2FA?: boolean
  tempToken?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  // accessToken 仅存内存，不持久化到 storage（防窃取）
  const accessToken = ref<string | null>(null)

  const isLoggedIn = computed(() => !!accessToken.value)
  const userName = computed(() => user.value?.name || '')
  const userRole = computed(() => user.value?.role || '')

  async function init() {
    const cached = uni.getStorageSync('user')
    if (cached) {
      try {
        user.value = typeof cached === 'string' ? JSON.parse(cached) : cached
      } catch {
        user.value = null
      }
    }
    // 尝试从安全存储恢复 accessToken
    try {
      const storedToken = await getSecureItem('accessToken')
      if (storedToken) {
        accessToken.value = storedToken
        // 恢复后立即从安全存储中移除，仅保留在内存中
        removeSecureItem('accessToken')
      }
    } catch {
      // 安全存储读取失败，保持未登录
    }
  }

  async function login(params: LoginParams) {
    loading.value = true
    try {
      const res = await http.post<LoginResponse>('/auth/login', params)

      if (res.requires2FA) {
        return { requires2FA: true, tempToken: res.tempToken }
      }

      // accessToken 仅存内存
      accessToken.value = res.accessToken
      setCachedAccessToken(res.accessToken)
      // refreshToken 存入安全存储（用于自动刷新）
      await setSecureItem('refreshToken', res.refreshToken)
      uni.setStorageSync('user', JSON.stringify(res.user))
      user.value = res.user

      return { success: true }
    } finally {
      loading.value = false
    }
  }

  async function verify2FA(tempToken: string, code: string) {
    loading.value = true
    try {
      const res = await http.post<LoginResponse>('/auth/login/2fa', { tempToken, code })

      // accessToken 仅存内存
      accessToken.value = res.accessToken
      setCachedAccessToken(res.accessToken)
      await setSecureItem('refreshToken', res.refreshToken)
      uni.setStorageSync('user', JSON.stringify(res.user))
      user.value = res.user

      return { success: true }
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    try {
      const res = await http.get<User>('/auth/me')
      user.value = res
      uni.setStorageSync('user', JSON.stringify(res))
    } catch {
      // 获取失败时不阻断
    }
  }

  async function logout() {
    try {
      await http.post('/auth/logout')
    } catch {
      // 即使后端调用失败，前端也要清理
    } finally {
      user.value = null
      accessToken.value = null
      setCachedAccessToken(null)
      removeSecureItem('accessToken')
      removeSecureItem('refreshToken')
      uni.removeStorageSync('user')
      uni.reLaunch({ url: '/pages/login/login' })
    }
  }

  async function getSSOTicket() {
    try {
      const res = await http.post<{ ticket: string; expiresIn: number }>('/auth/sso/ticket')
      return res.ticket
    } catch {
      return null
    }
  }

  return {
    user,
    loading,
    accessToken,
    isLoggedIn,
    userName,
    userRole,
    init,
    login,
    verify2FA,
    fetchMe,
    logout,
    getSSOTicket,
  }
})
