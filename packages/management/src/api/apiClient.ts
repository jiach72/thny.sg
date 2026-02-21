import axios from 'axios'
import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { ADMIN_LOGIN_PATH } from '@/config/security'

/**
 * 自定义 API 客户端接口
 * 响应拦截器已自动解包 { code, data } 结构，
 * 因此方法返回的是业务数据 T 而非 AxiosResponse<T>
 */
export interface ApiClient {
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
    post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
    put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
    patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
    delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
    // 保留底层能力，供需要完整 AxiosResponse 的场景使用
    defaults: AxiosRequestConfig
    interceptors: typeof _rawClient.interceptors
}

const _rawClient = axios.create({
    baseURL: '/api/v1',
    timeout: 10000,
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

// 响应拦截器 - 智能解包 + Token 刷新
_rawClient.interceptors.response.use(
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
            // 如果是登录或刷新接口本身的 401 错误，直接返回异常供页面处理，不进行跳转
            if (error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/refresh')) {
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
                        return _rawClient(config)
                    }
                } catch {
                    // 刷新失败，跳转登录
                    authStore.logout()
                    window.location.href = ADMIN_LOGIN_PATH
                }
            } else {
                authStore.logout()
                window.location.href = ADMIN_LOGIN_PATH
            }
        }

        return Promise.reject(error.response?.data || error)
    }
)

/**
 * 类型安全的 API 客户端
 *
 * 响应拦截器已自动解包 { code, data } 结构，返回值即为业务数据。
 *
 * @example
 * // 自动推断为 unknown，需要 as 或泛型
 * const leads = await apiClient.get<Lead[]>('/leads')
 *
 * // 也可以使用 as 断言
 * const data = await apiClient.get('/leads') as Lead[]
 */
const apiClient = _rawClient as unknown as ApiClient

export default apiClient
