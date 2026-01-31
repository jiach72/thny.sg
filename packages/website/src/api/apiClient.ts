import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios'

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1', // Fallback if env not set
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// 请求拦截器
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Website 可能不需要 Token，但预留扩展
        return config
    },
    (error) => Promise.reject(error)
)

// 响应拦截器 - 智能解包 (Smart Unwrap)
axiosInstance.interceptors.response.use(
    (response) => {
        const res = response.data
        // 检查是否为标准响应结构 { code, data, ... }
        if (res && typeof res === 'object' && 'code' in res) {
            if (res.code === 200) {
                return res.data
            }
            // 非 200 抛出错误
            return Promise.reject(new Error(res.message || 'Error'))
        }

        // 旧格式 (或者类似 News 目前的 { success: true, data: ... } 但没有 code 字段?)
        // News 后端目前返回 { success: true, data: ... } (无 code)
        // 所以目前会走这里，返回 res。
        return res
    },
    (error: AxiosError) => {
        return Promise.reject(error)
    }
)

/**
 * 封装后的 API 客户端
 * 由于响应拦截器已解包，返回类型为 Promise<any> 而非 AxiosResponse
 */
const apiClient = {
    get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
        return axiosInstance.get(url, config) as unknown as Promise<T>
    },
    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        return axiosInstance.post(url, data, config) as unknown as Promise<T>
    },
    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        return axiosInstance.put(url, data, config) as unknown as Promise<T>
    },
    delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
        return axiosInstance.delete(url, config) as unknown as Promise<T>
    },
    patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        return axiosInstance.patch(url, data, config) as unknown as Promise<T>
    },
}

export default apiClient

