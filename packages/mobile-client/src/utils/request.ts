/**
 * 跨端 HTTP 请求封装（基于 uni.request）
 * 自动注入 JWT Token、处理 401 自动刷新、统一错误提示
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown> | object
  header?: Record<string, string>
  showError?: boolean
}

interface ApiResponse<T = unknown> {
  code: number
  data: T
  message?: string
}

let isRefreshing = false
let pendingRequests: Array<() => void> = []

function getToken(): string | null {
  return uni.getStorageSync('accessToken') || null
}

function getRefreshToken(): string | null {
  return uni.getStorageSync('refreshToken') || null
}

function setTokens(accessToken: string, refreshToken: string) {
  uni.setStorageSync('accessToken', accessToken)
  uni.setStorageSync('refreshToken', refreshToken)
}

function clearTokens() {
  uni.removeStorageSync('accessToken')
  uni.removeStorageSync('refreshToken')
  uni.removeStorageSync('user')
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
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
      setTokens(body.data.accessToken, body.data.refreshToken)
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
          resolve(body.data ?? (body as unknown as T))
          return
        }

        // 401: Token 过期，尝试无感刷新
        if (statusCode === 401) {
          if (!isRefreshing) {
            isRefreshing = true
            const refreshed = await refreshAccessToken()
            isRefreshing = false

            if (refreshed) {
              // 重放所有挂起的请求
              pendingRequests.forEach((cb) => cb())
              pendingRequests = []
              // 重放当前请求
              try {
                const result = await request<T>(options)
                resolve(result)
              } catch (e) {
                reject(e)
              }
              return
            }

            // 刷新失败，强制登出
            clearTokens()
            uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
            setTimeout(() => {
              uni.reLaunch({ url: '/pages/login/login' })
            }, 1500)
            reject(new Error('TOKEN_EXPIRED'))
            return
          }

          // 正在刷新中，将当前请求排队
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

        // 其他错误
        const errMsg = body?.message || `请求失败 (${statusCode})`
        if (options.showError !== false) {
          uni.showToast({ title: errMsg, icon: 'none' })
        }
        reject(new Error(errMsg))
      },
      fail: (err) => {
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
