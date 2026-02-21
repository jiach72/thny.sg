/**
 * API 错误响应类型
 */
export interface ApiErrorResponse {
    success: false
    error: {
        code: string
        message: string
        details?: Record<string, unknown>
    }
    statusCode: number
}

/**
 * API 成功响应类型
 */
export interface ApiSuccessResponse<T = unknown> {
    success: true
    data?: T
    message?: string
}

/**
 * 统一 API 响应类型
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * 类型守卫：判断是否为 API 错误
 */
export function isApiError(response: unknown): response is ApiErrorResponse {
    return (
        typeof response === 'object' &&
        response !== null &&
        'success' in response &&
        response.success === false
    )
}

/**
 * 类型守卫：判断是否为 API 成功
 */
export function isApiSuccess<T>(response: unknown): response is ApiSuccessResponse<T> {
    return (
        typeof response === 'object' &&
        response !== null &&
        'success' in response &&
        response.success === true
    )
}

/**
 * 从错误中获取消息
 */
export function getErrorMessage(error: unknown): string {
    if (isApiError(error)) {
        return error.error.message
    }
    if (error instanceof Error) {
        return error.message
    }
    if (typeof error === 'string') {
        return error
    }
    return '未知错误，请稍后重试'
}
