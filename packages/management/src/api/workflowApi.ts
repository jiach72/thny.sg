import apiClient from './apiClient'

// ==================== 工作流管理 ====================

export interface AssignmentStats {
    userId: string
    userName: string
    activeLeads: number
    activeTasks: number
    workload: number
}

export interface FollowUpItem {
    type: 'LEAD' | 'TASK' | 'APPOINTMENT'
    id: string
    title: string
    description?: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    dueDate?: string
    status: string
    isOverdue: boolean
    lead?: {
        id: string
        contactName: string
        companyName?: string
    }
}

export interface OverdueStats {
    overdueTasks: number
    overdueLeads: number
    overdueAppointments: number
    details: {
        tasks: any[]
        leads: any[]
        appointments: any[]
    }
}

export interface SopStep {
    name: string
    description: string
    daysFromStart: number
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

export interface AssignResult {
    success: boolean
    lead: any
    assignedTo: {
        id: string
        name: string
    }
    reason: string
    task?: any
}

// 获取团队工作负载
export const getTeamWorkload = (): Promise<AssignmentStats[]> =>
    apiClient.get('/workflow/workload')

// 智能分配单个线索
export const autoAssignLead = (leadId: string): Promise<AssignResult> =>
    apiClient.post(`/workflow/leads/${leadId}/auto-assign`)

// 批量智能分配
export const batchAutoAssign = (): Promise<{ assigned: number; skipped: number; results: AssignResult[] }> =>
    apiClient.post('/workflow/leads/batch-assign')

// 获取当前用户跟进待办
export const getMyFollowUps = (): Promise<FollowUpItem[]> =>
    apiClient.get('/workflow/follow-ups')

// 获取指定用户跟进待办
export const getUserFollowUps = (userId: string): Promise<FollowUpItem[]> =>
    apiClient.get(`/workflow/follow-ups/${userId}`)

// 获取逾期统计
export const getOverdueStats = (): Promise<OverdueStats> =>
    apiClient.get('/workflow/overdue-stats')

// 获取 SOP 步骤模板
export const getSopSteps = (serviceType: string): Promise<SopStep[]> =>
    apiClient.get(`/workflow/sop/${serviceType}`)

// 为线索创建 SOP 任务序列
export const createSopTasks = (leadId: string, serviceType: string): Promise<{ success: boolean; tasks: any[] }> =>
    apiClient.post(`/workflow/leads/${leadId}/create-sop`, { serviceType })

// 保存工作流配置
export const saveWorkflowDefinition = (data: any): Promise<any> =>
    apiClient.post('/workflow/definitions', data)

// 测试工作流配置
export const testWorkflowDefinition = (data: any): Promise<any> =>
    apiClient.post('/workflow/definitions/test', data)

export default {
    getTeamWorkload,
    autoAssignLead,
    batchAutoAssign,
    getMyFollowUps,
    getUserFollowUps,
    getOverdueStats,
    getSopSteps,
    createSopTasks,
    saveWorkflowDefinition,
    testWorkflowDefinition
}

