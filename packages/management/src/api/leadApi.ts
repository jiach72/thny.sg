import apiClient from './apiClient'
import type {
    Lead,
    CreateLeadPayload,
    UpdateLeadPayload,
    AssignLeadPayload,
    LeadFilters,
    PaginatedResponse,
    PaginationParams
} from '@tonghai/shared/types'

export const leadApi = {
    /**
     * 获取线索列表
     */
    getList(
        filters?: LeadFilters,
        pagination?: PaginationParams
    ): Promise<PaginatedResponse<Lead>> {
        return apiClient.get('/leads', { params: { ...filters, ...pagination } })
    },

    /**
     * 获取线索统计
     */
    getStats(): Promise<{
        total: number
        byStatus: Record<string, number>
        bySource: Record<string, number>
        trend: { date: string; count: number }[]
    }> {
        return apiClient.get('/leads/stats')
    },

    /**
     * 获取最近活动
     */
    getActivities(limit: number = 20): Promise<NonNullable<Lead['activities']>> {
        return apiClient.get('/leads/activities', { params: { limit } })
    },

    /**
     * 获取线索详情
     */
    getById(id: string): Promise<Lead> {
        return apiClient.get(`/leads/${id}`)
    },

    /**
     * 创建线索
     */
    create(payload: CreateLeadPayload): Promise<Lead> {
        return apiClient.post('/leads', payload)
    },

    /**
     * 更新线索
     */
    update(id: string, payload: UpdateLeadPayload): Promise<Lead> {
        return apiClient.put(`/leads/${id}`, payload)
    },

    /**
     * 分配线索
     */
    assign(id: string, payload: AssignLeadPayload): Promise<Lead> {
        return apiClient.post(`/leads/${id}/assign`, payload)
    },

    /**
     * 删除线索
     */
    delete(id: string): Promise<{ success: boolean }> {
        return apiClient.delete(`/leads/${id}`)
    },

    /**
     * 将线索转化为客户
     */
    convertToCustomer(id: string, overrides?: { email?: string, phone?: string }): Promise<{
        success: boolean
        message: string
        customerId: string
        userId: string
        setupToken: string
        setupUrl: string
    }> {
        return apiClient.post(`/leads/${id}/convert`, overrides)
    },

    /**
     * 撞库检测
     */
    checkDuplicates(payload: { email?: string; phone?: string; excludeLeadId?: string }): Promise<{
        hasDuplicates: boolean
        leads: { id: string; contactName: string; email?: string }[]
        customers: { id: string; companyName: string; email?: string }[]
    }> {
        return apiClient.post('/leads/check-duplicates', payload)
    },

    /**
     * 添加线索备注
     */
    addNote(id: string, content: string): Promise<NonNullable<Lead['activities']>[number]> {
        return apiClient.post(`/leads/${id}/notes`, { content })
    },

    importLeads(formData: FormData) {
        return apiClient.post('/leads/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },
}

export default leadApi
