import axios from 'axios'
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const apiClient: AxiosInstance = axios.create({
    baseURL: '/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// 请求拦截器 - 添加 Token
apiClient.interceptors.request.use(
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
apiClient.interceptors.response.use(
    (response) => {
        const res = response.data
        // 智能解包 (Smart Unwrap)
        // 检测标准响应结构: { code, data, ... }
        if (res && typeof res === 'object' && 'code' in res) {
            if (res.code === 200) {
                return res.data // 返回解包后的数据
            }
            // 非 200 状态码视为业务错误，抛出异常
            return Promise.reject(new Error(res.message || 'Error'))
        }
        // 旧格式或非标准格式，原样返回
        return res
    },
    async (error: AxiosError) => {
        const authStore = useAuthStore()

        if (error.response?.status === 401) {
            // 如果是登录接口本身的 401 错误，直接返回异常供页面处理，不进行跳转
            if (error.config?.url?.includes('/auth/login')) {
                return Promise.reject(error.response?.data || error)
            }

            // Token 过期，尝试刷新
            if (authStore.refreshToken) {
                try {
                    await authStore.refreshAccessToken()
                    // 重试原请求
                    const config = error.config
                    if (config) {
                        config.headers.Authorization = `Bearer ${authStore.accessToken}`
                        return apiClient(config)
                    }
                } catch {
                    // 刷新失败，跳转登录
                    authStore.logout()
                    window.location.href = '/login'
                }
            } else {
                authStore.logout()
                window.location.href = '/login'
            }
        }

        return Promise.reject(error.response?.data || error)
    }
)

export default apiClient
