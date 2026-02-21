/**
 * 从 unknown 错误中安全提取错误消息
 * 用于 catch (error: unknown) 场景
 */
export function getErrorMessage(error: unknown, fallback = '操作失败'): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    if (error && typeof error === 'object' && 'message' in error) {
        return String((error as { message: unknown }).message)
    }
    return fallback
}
