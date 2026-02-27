import axios from 'axios'
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'

export interface ApiClient {
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
    post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
    put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
    patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
    delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
    defaults: AxiosRequestConfig
    interceptors: AxiosInstance['interceptors']
}

const _rawClient: AxiosInstance = axios.create({
    baseURL: '/api/v1',
    timeout: 10000,
    withCredentials: true, // 携带 httpOnly cookie（refreshToken）
    headers: {
        'Content-Type': 'application/json',
    },
})

// 请求拦截器 - 添加 Token
_rawClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const authStore = useAuthStore()
        if (authStore.accessToken) {
            config.headers.Authorization = `Bearer ${authStore.accessToken}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// 响应拦截器 - 处理错误和 Token 刷新
_rawClient.interceptors.response.use(
    (response) => {
        const res = response.data
        // 智能解包 (Smart Unwrap)
        if (res && typeof res === 'object' && 'code' in res) {
            if (res.code === 200) {
                return res.data
            }
            return Promise.reject(new Error(res.message || 'Error'))
        }
        return res
    },
    async (error: AxiosError) => {
        const authStore = useAuthStore()

        if (error.response?.status === 401) {
            // 如果是登录或刷新接口本身的 401 错误，直接抛出，不拦截
            if (error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/refresh')) {
                return Promise.reject(error.response?.data || error)
            }

            // Token 过期，尝试用 httpOnly cookie 中的 refreshToken 刷新
            try {
                await authStore.refreshAccessToken()
                // 重试原请求
                const config = error.config
                if (config) {
                    config.headers.Authorization = `Bearer ${authStore.accessToken}`
                    return _rawClient(config)
                }
            } catch {
                // 刷新失败，跳转登录
                authStore.logout()
                window.location.href = '/login'
            }
        }

        return Promise.reject(error.response?.data || error)
    }
)

const apiClient = _rawClient as unknown as ApiClient
export default apiClient
