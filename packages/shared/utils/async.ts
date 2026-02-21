import type { ApiErrorResponse, ApiResponse, ApiSuccessResponse } from '../types/errors'

/**
 * 异步操作结果类型
 */
export type AsyncResult<T, E = ApiErrorResponse> =
    | { success: true; data: T }
    | { success: false; error: E }

/**
 * 安全执行异步操作
 */
export async function safeAsync<T>(fn: () => Promise<T>): Promise<AsyncResult<T>> {
    try {
        const data = await fn()
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error as ApiErrorResponse }
    }
}

/**
 * 处理 API 调用的辅助函数
 */
export async function handleApiCall<T>(
    apiCall: () => Promise<ApiResponse<T>>,
    onSuccess?: (data: T) => void,
    onError?: (error: ApiErrorResponse) => void
): Promise<AsyncResult<T>> {
    try {
        const response = await apiCall()

        if ('success' in response && response.success) {
            const successResponse = response as ApiSuccessResponse<T>
            onSuccess?.(successResponse.data as T)
            return { success: true, data: successResponse.data as T }
        } else {
            const errorResponse = response as ApiErrorResponse
            onError?.(errorResponse)
            return { success: false, error: errorResponse }
        }
    } catch (error) {
        const apiError: ApiErrorResponse = {
            success: false,
            error: {
                code: 'NETWORK_ERROR',
                message: '网络错误，请检查网络连接',
            },
            statusCode: 0,
        }
        onError?.(apiError)
        return { success: false, error: apiError }
    }
}
