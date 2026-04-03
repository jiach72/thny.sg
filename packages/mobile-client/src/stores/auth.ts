/**
 * Pinia Auth Store — 跨端鉴权中枢
 * 管理 Token 生命周期、用户状态、登录/登出
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import http from '../utils/request'

interface UserInfo {
  id: string
  name: string
  email: string
  role: string
  roleId?: string
  avatarUrl?: string
}

interface LoginParams {
  email: string
  password: string
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UserInfo
  requires2FA?: boolean
  tempToken?: string
}

export const useAuthStore = defineStore('auth', () => {
  // 响应式状态
  const user = ref<UserInfo | null>(null)
  const loading = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!uni.getStorageSync('accessToken'))
  const userName = computed(() => user.value?.name || '')
  const userRole = computed(() => user.value?.role || '')

  // 初始化：从本地缓存恢复用户信息
  function init() {
    const cached = uni.getStorageSync('user')
    if (cached) {
      try {
        user.value = typeof cached === 'string' ? JSON.parse(cached) : cached
      } catch {
        user.value = null
      }
    }
  }

  /**
   * 登录
   */
  async function login(params: LoginParams) {
    loading.value = true
    try {
      const res = await http.post<LoginResponse>('/auth/login', params)

      // 需要 2FA
      if (res.requires2FA) {
        return { requires2FA: true, tempToken: res.tempToken }
      }

      // 常规登录成功
      uni.setStorageSync('accessToken', res.accessToken)
      uni.setStorageSync('refreshToken', res.refreshToken)
      uni.setStorageSync('user', JSON.stringify(res.user))
      user.value = res.user

      return { success: true }
    } finally {
      loading.value = false
    }
  }

  /**
   * 2FA 验证登录
   */
  async function verify2FA(tempToken: string, code: string) {
    loading.value = true
    try {
      const res = await http.post<LoginResponse>('/auth/login/2fa', { tempToken, code })

      uni.setStorageSync('accessToken', res.accessToken)
      uni.setStorageSync('refreshToken', res.refreshToken)
      uni.setStorageSync('user', JSON.stringify(res.user))
      user.value = res.user

      return { success: true }
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取当前用户完整信息
   */
  async function fetchMe() {
    try {
      const res = await http.get<UserInfo>('/auth/me')
      user.value = res
      uni.setStorageSync('user', JSON.stringify(res))
    } catch {
      // 获取失败时不阻断
    }
  }

  /**
   * 登出
   */
  async function logout() {
    try {
      await http.post('/auth/logout')
    } catch {
      // 即使后端调用失败，前端也要清理
    } finally {
      user.value = null
      uni.removeStorageSync('accessToken')
      uni.removeStorageSync('refreshToken')
      uni.removeStorageSync('user')
      uni.reLaunch({ url: '/pages/login/login' })
    }
  }

  return {
    user,
    loading,
    isLoggedIn,
    userName,
    userRole,
    init,
    login,
    verify2FA,
    fetchMe,
    logout,
  }
})
