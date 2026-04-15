import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, apiClient } from '@/api'
import type { LoginPayload, LoginResponse, RefreshTokenResponse } from '@tonghai/shared/types'
import { logger } from '@/utils/logger'

interface RefreshResult {
  accessToken: string
}

interface AdminUser {
    id: string
    name: string
    email: string
    role: string
    roleId?: string
    roleName?: string
    avatarUrl?: string
}

export const useAuthStore = defineStore('auth', () => {
    const accessToken = ref<string | null>(null)
    const user = ref<AdminUser | null>(null)
    const permissions = ref<string[]>([])
    const loading = ref(false)
    const isInitialized = ref(false)

    const isAuthenticated = computed(() => !!accessToken.value)
    const isAdmin = computed(() => user.value?.role === 'ADMIN')
    const isManager = computed(() => ['ADMIN', 'MANAGER'].includes(user.value?.role || ''))

    async function login(payload: LoginPayload) {
        loading.value = true
        try {
            const data: LoginResponse = await authApi.login(payload)

            if (data.user?.role === 'CUSTOMER') {
                throw new Error('客户账号无法登录管理系统，请使用客户门户')
            }

            accessToken.value = data.accessToken
            user.value = {
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role,
                avatarUrl: data.user.avatarUrl,
            }

            await fetchPermissions()

            return data
        } finally {
            loading.value = false
        }
    }

    async function fetchPermissions() {
        if (!accessToken.value || !user.value) return

        try {
            if (user.value.role === 'ADMIN') {
                permissions.value = ['*']
                return
            }

            const response = await apiClient.get('/auth/me/permissions')
            permissions.value = Array.isArray(response) ? response : (response as any)?.data || []
        } catch (error) {
            logger.error('AuthStore', '获取权限失败:', error)
            permissions.value = []
        }
    }

    async function fetchCurrentUser() {
        if (!accessToken.value) return null

        try {
            const data: Record<string, unknown> = await authApi.getCurrentUser() as Record<string, unknown>
            const role = (data.roleCode as string) || ((data.role as Record<string, string>)?.code) || (data.role as string)

            if (role === 'CUSTOMER') {
                logout()
                return null
            }

            user.value = {
                id: data.id as string,
                name: data.name as string,
                email: data.email as string,
                role,
                avatarUrl: data.avatarUrl as string | undefined,
            }

            await fetchPermissions()

            return data
        } catch {
            logout()
            return null
        }
    }

    let refreshPromise: Promise<RefreshResult> | null = null

    async function refreshAccessToken(): Promise<RefreshResult> {
        if (refreshPromise) return refreshPromise

        refreshPromise = (async () => {
            try {
                const data: RefreshTokenResponse = await authApi.refreshToken('')
                accessToken.value = data.accessToken

                const userProfile: Record<string, unknown> = await authApi.getCurrentUser() as Record<string, unknown>
                const role = (userProfile.roleCode as string) || ((userProfile.role as Record<string, string>)?.code) || (userProfile.role as string)
                if (role === 'CUSTOMER') {
                    throw new Error('客户账号无法登录管理系统，请使用客户门户')
                }

                user.value = {
                    id: userProfile.id as string,
                    name: userProfile.name as string,
                    email: userProfile.email as string,
                    role,
                    avatarUrl: userProfile.avatarUrl as string | undefined,
                }

                await fetchPermissions()

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

    function logout() {
        accessToken.value = null
        user.value = null
        permissions.value = []
    }

    function can(permissionCode: string): boolean {
        if (user.value?.role === 'ADMIN' || permissions.value.includes('*')) {
            return true
        }
        return permissions.value.includes(permissionCode)
    }

    async function initAuth() {
        if (isInitialized.value) return

        if (accessToken.value && !user.value) {
            await fetchCurrentUser()
        } else if (!accessToken.value) {
            try {
                await refreshAccessToken()
            } catch {
                // refreshToken cookie 不存在或已过期，保持未登录状态
            }
        }

        isInitialized.value = true
    }

    return {
        accessToken,
        user,
        permissions,
        loading,
        isInitialized,
        isAuthenticated,
        isAdmin,
        isManager,
        login,
        logout,
        fetchCurrentUser,
        fetchPermissions,
        refreshAccessToken,
        initAuth,
        can,
    }
})
