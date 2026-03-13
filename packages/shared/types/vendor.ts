// 供应商类型
export type VendorType =
    | 'LEGAL'
    | 'ACCOUNTING'
    | 'CORPORATE_SECRETARY'
    | 'IMMIGRATION'
    | 'BANKING'
    | 'INSURANCE'
    | 'IT_SERVICE'
    | 'OTHER'

// 供应商状态
export type VendorStatus = 'ACTIVE' | 'INACTIVE'

// 供应商实体
export interface Vendor {
    id: string
    name: string
    type: VendorType
    status: VendorStatus
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    website?: string
    address?: string
    notes?: string
    rating?: number
    contractStart?: string
    contractEnd?: string
    createdAt: string
    updatedAt: string
    deletedAt?: string
    // 关联数据
    assignments?: VendorAssignment[]
}

// 供应商项目分配
export interface VendorAssignment {
    id: string
    vendorId: string
    projectId: string
    role?: string
    fee?: number
    createdAt: string
    project?: { id: string; title: string }
}

// 创建供应商请求
export interface CreateVendorPayload {
    name: string
    type: VendorType
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    website?: string
    address?: string
    notes?: string
}

// 更新供应商请求
export interface UpdateVendorPayload {
    name?: string
    type?: VendorType
    status?: VendorStatus
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    website?: string
    address?: string
    notes?: string
    rating?: number
    contractStart?: string
    contractEnd?: string
}

// 供应商统计
export interface VendorStats {
    total: number
    active: number
    inactive: number
    expiringContracts: number
    byType: Array<{ type: string; count: number }>
}
