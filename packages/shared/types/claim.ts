import type { UserRef } from './user'

// 报销单状态
export type ClaimStatus =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'MANAGER_APPROVED'
    | 'APPROVED'
    | 'REJECTED'
    | 'PAID'

// 报销费用类别
export type ExpenseCategory =
    | 'TRANSPORT'
    | 'MEAL'
    | 'ACCOMMODATION'
    | 'OFFICE_SUPPLY'
    | 'CLIENT_ENTERTAINMENT'
    | 'TRAINING'
    | 'OTHER'

// 报销单实体
export interface Claim {
    id: string
    claimNumber: string
    title: string
    description?: string
    status: ClaimStatus
    totalAmount: number
    currency: string
    submittedAt?: string
    managerApprovedAt?: string
    adminApprovedAt?: string
    rejectedAt?: string
    paidAt?: string
    paymentRef?: string
    rejectionReason?: string
    createdAt: string
    updatedAt: string
    // 关联数据
    submitter?: UserRef
    managerApprover?: UserRef
    adminApprover?: UserRef
    rejector?: UserRef
    items?: ClaimItem[]
}

// 报销明细项
export interface ClaimItem {
    id: string
    claimId: string
    category: ExpenseCategory
    description: string
    amount: number
    expenseDate: string
    receiptUrl?: string
    notes?: string
    createdAt: string
}

// 创建报销单请求
export interface CreateClaimPayload {
    title: string
    description?: string
    currency?: string
}

// 添加报销明细请求
export interface AddClaimItemPayload {
    category: ExpenseCategory
    description: string
    amount: number
    expenseDate: string
    notes?: string
}

// 报销统计
export interface ClaimStats {
    total: number
    pending: number
    approved: number
    paid: number
    totalApprovedAmount: number
}
