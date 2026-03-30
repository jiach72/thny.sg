// 项目状态枚举
export type ProjectStatus =
    | 'PLANNING'
    | 'ACTIVE'
    | 'ON_HOLD'
    | 'COMPLETED'
    | 'ARCHIVED'

// KYC 状态枚举
export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEW'

// 风险等级枚举
export type RiskGrade = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// 客户实体
export interface Customer {
    id: string
    leadId: string
    familyMembers?: FamilyMember[]
    companyInfo?: CompanyInfo
    kycStatus: KycStatus
    riskGrade: RiskGrade
    createdAt: string
    updatedAt: string
}

// 家庭成员
export interface FamilyMember {
    name: string
    relationship: string
    dateOfBirth?: string
    nationality?: string
}

// 公司信息
export interface CompanyInfo {
    name: string
    registration?: string
    industry?: string
    employees?: number
}

// 项目实体
export interface Project {
    id: string
    title?: string
    description?: string
    customerId: string
    projectType: string
    status: ProjectStatus
    completionPercentage: number
    startDate?: string
    estimatedEndDate?: string
    actualEndDate?: string
    budget?: number
    currency: string
    createdAt: string
    updatedAt: string
}

// 创建项目请求
export interface CreateProjectPayload {
    customerId: string
    projectType: string
    startDate?: string
    estimatedEndDate?: string
    budget?: number
    currency?: string
}

// 更新项目请求
export interface UpdateProjectPayload {
    status?: ProjectStatus
    completionPercentage?: number
    startDate?: string
    estimatedEndDate?: string
    actualEndDate?: string
    budget?: number
}
