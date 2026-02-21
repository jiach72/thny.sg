/**
 * 通知类型
 */
export type NotificationType =
    | 'LEAD_ASSIGNED'
    | 'TASK_STATUS_CHANGED'
    | 'NEW_MESSAGE'
    | 'SYSTEM_ANNOUNCEMENT'
    | 'TASK_DUE_REMINDER'
    | 'PROJECT_UPDATE'

/**
 * 实时通知数据结构
 */
export interface RealtimeNotification {
    id: string
    type: NotificationType
    title: string
    message: string
    data?: Record<string, unknown>
    createdAt: string
}
