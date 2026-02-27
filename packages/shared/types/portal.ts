import { Project } from './project'

// 顾问信息
export interface ConsultantInfo {
    id: string
    name: string
    avatar?: string
    contactNumber?: string
    title?: string
}

// 侧边栏及组件使用的待办事项
export interface ActionItem {
    id: string
    type: 'document' | 'project' | 'invoice' | 'message'
    title: string
    description: string
    createdAt: Date | string
    projectId?: string
    priority?: 'high' | 'normal' | 'low'
    isRead?: boolean
}

// 仪表盘里程碑
export interface Milestone {
    id: string
    title: string
    dueDate: string | Date
    project?: {
        id: string
        title: string
    }
}

// 门户项目视图
export interface PortalProject extends Project {
    consultant?: ConsultantInfo
    tasks?: any[]
    documents?: PortalDocument[]
}

// 仪表盘统计
export interface PortalDashboardStats {
    activeProjects: number
    pendingDocuments: number
    upcomingMilestones?: Milestone[]
}

// 门户站内消息
export interface PortalMessage {
    id: string
    type: 'SYSTEM' | 'PROJECT' | 'DOCUMENT' | 'INVOICE' | 'GENERAL'
    title: string
    content: string
    summary?: string
    isRead: boolean
    projectId?: string
    senderId?: string
    recipientId: string
    createdAt: string
    project?: {
        id: string
        title: string
    }
    sender?: {
        id: string
        name: string
        avatar?: string
    }
}

// 门户文档
export interface PortalDocument {
    id: string
    title: string
    fileName: string
    type: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'
    filePath: string
    fileUrl: string
    fileSize: number
    mimeType: string
    version: number
    projectId: string
    customerId: string
    uploadedById: string
    createdAt: string
    updatedAt: string
    // 外键关联
    project?: { id: string; title: string }
    signatureRequests?: {
        id: string
        status: 'PENDING' | 'SIGNED' | 'DECLINED'
        signedAt?: string
    }[]
}
