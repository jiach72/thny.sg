/**
 * 跨端 HTTP 请求封装（基于 uni.request）
 * 自动注入 JWT Token、处理 401 自动刷新、统一错误提示
 */

import { setSecureItem, removeSecureItem } from './secureStorage'

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown> | object
  header?: Record<string, string>
  showError?: boolean
}

interface ApiResponse<T = unknown> {
  code: number
  success?: boolean
  data: T
  message?: string
}

let isRefreshing = false
let pendingRequests: Array<() => void> = []

// 内存中的 accessToken 缓存（避免频繁读取安全存储）
let _cachedAccessToken: string | null = null

/**
 * 设置内存中的 accessToken 缓存
 * 由 auth store 在登录/刷新成功后调用
 */
export function setCachedAccessToken(token: string | null): void {
  _cachedAccessToken = token
}

function getToken(): string | null {
  return _cachedAccessToken || getSecureItemSync('accessToken')
}

function getRefreshTokenSync(): string | null {
  return getSecureItemSync('refreshToken')
}

async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  _cachedAccessToken = accessToken
  await setSecureItem('refreshToken', refreshToken)
}

function clearTokens() {
  _cachedAccessToken = null
  removeSecureItem('accessToken')
  removeSecureItem('refreshToken')
  uni.removeStorageSync('user')
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshTokenSync()
  if (!refreshToken) return false

  try {
    const res = await uni.request({
      url: `${BASE_URL}/auth/refresh`,
      method: 'POST',
      data: { refreshToken },
      header: { 'Content-Type': 'application/json' },
    })

    const body = res.data as ApiResponse<{ accessToken: string; refreshToken: string }>
    if (body?.code === 200 && body.data?.accessToken) {
      await setTokens(body.data.accessToken, body.data.refreshToken)
      return true
    }
    return false
  } catch {
    return false
  }
}

export function request<T = unknown>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.header,
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    uni.request({
      url: options.url.startsWith('http') ? options.url : `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: headers,
      success: async (res) => {
        const statusCode = res.statusCode
        const body = res.data as ApiResponse<T>

        if (statusCode === 200 || statusCode === 201) {
          // 新格式 { code, success, data }：检查 data 字段是否存在（含 null），
          // 而非依赖 ?? 运算符（null ?? fallback 会错误回退到整个 body）
          if (body && typeof body === 'object' && 'data' in body) {
            resolve(body.data as T)
          } else {
            // 兼容旧格式：后端直接返回裸数据（无 code/data 包装）
            resolve(body as unknown as T)
          }
          return
        }

        if (statusCode === 401) {
          if (!isRefreshing) {
            isRefreshing = true
            const refreshed = await refreshAccessToken()
            isRefreshing = false

            if (refreshed) {
              pendingRequests.forEach((cb) => cb())
              pendingRequests = []
              try {
                const result = await request<T>(options)
                resolve(result)
              } catch (e) {
                reject(e)
              }
              return
            }

            clearTokens()
            uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
            setTimeout(() => {
              uni.reLaunch({ url: '/pages/login/login' })
            }, 1500)
            reject(new Error('TOKEN_EXPIRED'))
            return
          }

          return new Promise<void>((queueResolve) => {
            pendingRequests.push(async () => {
              try {
                const result = await request<T>(options)
                resolve(result)
              } catch (e) {
                reject(e)
              }
              queueResolve()
            })
          })
        }

        const errMsg = body?.message || `请求失败 (${statusCode})`
        if (options.showError !== false) {
          uni.showToast({ title: errMsg, icon: 'none' })
        }
        reject(new Error(errMsg))
      },
      fail: () => {
        const errMsg = '网络异常，请检查连接'
        if (options.showError !== false) {
          uni.showToast({ title: errMsg, icon: 'none' })
        }
        reject(new Error(errMsg))
      },
    })
  })
}

export const http = {
  get: <T>(url: string, data?: object) =>
    request<T>({ url, method: 'GET', data }),
  post: <T>(url: string, data?: object) =>
    request<T>({ url, method: 'POST', data }),
  put: <T>(url: string, data?: object) =>
    request<T>({ url, method: 'PUT', data }),
  del: <T>(url: string, data?: object) =>
    request<T>({ url, method: 'DELETE', data }),
}

export default http
