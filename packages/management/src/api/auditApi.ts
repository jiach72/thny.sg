import apiClient from './apiClient'

export interface AuditLogFilters {
    page?: number
    limit?: number
    userId?: string
    action?: string
    resource?: string
    startDate?: string
    endDate?: string
}

export const auditApi = {
    /**
     * 获取审计日志列表
     */
    getAuditLogs(filters: AuditLogFilters = {}) {
        return apiClient.get('/audit', { params: filters })
    },
}

export default auditApi
