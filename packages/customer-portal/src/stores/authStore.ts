import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

interface User {
    id: string
    name: string
    email: string
    role: string
    avatarUrl?: string
    familyMembers?: any[]
    riskGrade?: string
    phone?: string
    company?: string
}

export const useAuthStore = defineStore('auth', () => {
    // 状态
    const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
    const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
    const user = ref<User | null>(null)
    const loading = ref(false)

    // 计算属性
    const isAuthenticated = computed(() => !!accessToken.value)
    const isCustomer = computed(() => user.value?.role === 'CUSTOMER')

    // 方法
    async function login(payload: { email: string; password: string }) {
        loading.value = true
        try {
            const data = await authApi.login(payload) as any

            accessToken.value = data.accessToken
            refreshToken.value = data.refreshToken
            user.value = data.user

            localStorage.setItem('accessToken', data.accessToken)
            localStorage.setItem('refreshToken', data.refreshToken)

            return data
        } finally {
            loading.value = false
        }
    }

    async function fetchCurrentUser() {
        if (!accessToken.value) return null

        try {
            const data = await authApi.getCurrentUser() as any
            user.value = data
            return data
        } catch {
            logout()
            return null
        }
    }

    async function refreshAccessToken() {
        if (!refreshToken.value) {
            throw new Error('No refresh token')
        }

        const data = await authApi.refreshToken(refreshToken.value) as any
        accessToken.value = data.accessToken
        localStorage.setItem('accessToken', data.accessToken)

        return data
    }

    function logout() {
        accessToken.value = null
        refreshToken.value = null
        user.value = null
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
    }

    function setTokens(newAccessToken: string, newRefreshToken: string) {
        accessToken.value = newAccessToken
        refreshToken.value = newRefreshToken
        localStorage.setItem('accessToken', newAccessToken)
        localStorage.setItem('refreshToken', newRefreshToken)
    }

    function setUser(userData: any) {
        user.value = userData
    }

    // 初始化获取用户信息
    if (accessToken.value && !user.value) {
        fetchCurrentUser()
    }

    return {
        // 状态
        accessToken,
        refreshToken,
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
