import type { UserRef } from './user'

// 线索状态枚举
export type LeadStatus =
    | 'NEW'
    | 'CONTACTED'
    | 'QUALIFIED'
    | 'IN_PROGRESS'
    | 'LOST'
    | 'CONVERTED'

// 线索实体
export interface Lead {
    id: string
    contactName: string
    email?: string
    phone?: string
    companyName?: string
    country?: string
    serviceTypes: string[]
    budgetRange?: string
    sourceChannel: string
    inquiryMessage?: string
    assignedTo?: UserRef
    status: LeadStatus
    tags: string[]
    score: number
    lastContactedAt?: string
    createdAt: string
    updatedAt: string
    // 关联数据（仅在详情接口返回）
    activities?: Array<{
        id: string
        actionType: string
        entityType?: string
        entityId?: string
        description: string
        changes?: Record<string, unknown>
        createdAt: string
        actor?: UserRef
    }>
    tasks?: Array<{
        id: string
        title: string
        status: string
    }>
}

// 创建线索请求
export interface CreateLeadPayload {
    contactName: string
    email?: string
    phone?: string
    companyName?: string
    country?: string
    serviceTypes?: string[]
    budgetRange?: string
    sourceChannel: string
    inquiryMessage?: string
    tags?: string[]
}

// 更新线索请求
export interface UpdateLeadPayload {
    contactName?: string
    email?: string
    phone?: string
    companyName?: string
    country?: string
    serviceTypes?: string[]
    budgetRange?: string
    inquiryMessage?: string
    status?: LeadStatus
    tags?: string[]
    score?: number
    lastContactedAt?: string
}

// 线索分配请求
export interface AssignLeadPayload {
    assignedToId: string
    reason?: string
}

// 线索过滤参数
export interface LeadFilters {
    status?: LeadStatus
    assignedToId?: string
    sourceChannel?: string
    country?: string
    tags?: string[]
    search?: string
}
