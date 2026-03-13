import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'
import type { User, LoginResponse } from '@tonghai/shared'

export const useAuthStore = defineStore('auth', () => {
    // 状态
    // accessToken 存内存 + localStorage（页面刷新恢复用）
    // refreshToken 通过 httpOnly cookie 自动管理，前端无需持有
    const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
    const user = ref<User | null>(null)
    const loading = ref(false)

    // 计算属性
    const isAuthenticated = computed(() => !!accessToken.value)
    const isCustomer = computed(() => user.value?.role === 'CUSTOMER')

    // 方法
    async function login(payload: { email: string; password: string }): Promise<LoginResponse> {
        loading.value = true
        try {
            const data: LoginResponse = await authApi.login(payload)

            // 检查用户角色 - 非客户不能登录客户门户
            if (data.user?.role !== 'CUSTOMER') {
                throw new Error('此门户仅限客户访问')
            }

            // accessToken 存内存 + localStorage
            // refreshToken 已由后端通过 httpOnly cookie 设置
            accessToken.value = data.accessToken
            user.value = data.user as User

            localStorage.setItem('accessToken', data.accessToken)

            return data
        } finally {
            loading.value = false
        }
    }

    async function fetchCurrentUser(): Promise<User | null> {
        if (!accessToken.value) return null

        try {
            const data: User = await authApi.getCurrentUser()
            // 检查用户角色 - 非客户不能停留在客户门户
            if (data.role !== 'CUSTOMER') {
                logout()
                return null
            }

            user.value = data
            return data
        } catch {
            logout()
            return null
        }
    }

    let refreshPromise: Promise<unknown> | null = null

    async function refreshAccessToken(): Promise<unknown> {
        if (refreshPromise) return refreshPromise

        refreshPromise = (async () => {
            try {
                // refreshToken 通过 httpOnly cookie 自动携带
                const data = await authApi.refreshToken('')
                accessToken.value = data.accessToken
                localStorage.setItem('accessToken', data.accessToken)

                // 刷新完 token 后立即获取一次用户信息以验证角色
                // 避免管理员的 cookie 在客户门户导致获取了错误的 token
                const userProfile = await authApi.getCurrentUser()
                if (userProfile.role !== 'CUSTOMER') {
                    throw new Error('此门户仅限客户访问')
                }
                user.value = userProfile

                return data
            } catch (error) {
                logout()
                throw error
            } finally {
                refreshPromise = null
            }
        })()

        return refreshPromise
    }

    function logout(): void {
        accessToken.value = null
        user.value = null
        localStorage.removeItem('accessToken')
        // refreshToken cookie 由后端 /auth/logout 清除
    }

    function setTokens(newAccessToken: string, _newRefreshToken?: string): void {
        accessToken.value = newAccessToken
        localStorage.setItem('accessToken', newAccessToken)
        // refreshToken 由 httpOnly cookie 管理，忽略前端传入值
    }

    function setUser(userData: User): void {
        user.value = userData
    }

    // 初始化获取用户信息
    if (accessToken.value && !user.value) {
        fetchCurrentUser()
    }

    return {
        // 状态
        accessToken,
        user,
        loading,
        // 计算属性
        isAuthenticated,
        isCustomer,
        // 方法
        login,
        logout,
        fetchCurrentUser,
        refreshAccessToken,
        setTokens,
        setUser,
    }
})
