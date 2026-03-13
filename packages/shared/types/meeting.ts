import type { UserRef } from './user'

// 会议纪要
export interface MeetingMinutes {
    id: string
    appointmentId: string
    content: string
    actionItems?: string
    attendees?: string[]
    recordedById: string
    recordedBy?: UserRef
    createdAt: string
    updatedAt: string
}

// 会议室状态
export type MeetingRoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'

// 会议室
export interface MeetingRoom {
    id: string
    name: string
    capacity: number
    location?: string
    equipment?: string[]
    status: MeetingRoomStatus
    createdAt: string
    updatedAt: string
}

// 费用类别配置
export interface ExpenseCategoryConfig {
    id: string
    code: string
    name: string
    description?: string
    maxAmount?: number
    isActive: boolean
    sortOrder: number
}

// 创建/更新会议纪要请求
export interface UpsertMinutesPayload {
    content: string
    actionItems?: string
    attendees?: string[]
}

// 创建会议室请求
export interface CreateMeetingRoomPayload {
    name: string
    capacity: number
    location?: string
    equipment?: string[]
}

// 更新会议室请求
export interface UpdateMeetingRoomPayload {
    name?: string
    capacity?: number
    location?: string
    equipment?: string[]
    status?: MeetingRoomStatus
}
