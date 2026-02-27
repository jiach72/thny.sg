import apiClient from './apiClient'
import type {
    LoginResponse,
    RefreshTokenResponse,
    User,
    Project,
    PortalProject,
    PortalDocument,
    PortalMessage,
    PortalDashboardStats,
    FaqCategory,
    Invoice,
    PaginatedResponse,
    IdResponse
} from '@tonghai/shared'

export const authApi = {
    /**
     * 客户登录
     */
    login(payload: { email: string; password: string }) {
        return apiClient.post<LoginResponse>('/auth/login', payload)
    },

    /**
     * 验证双重认证登录
     */
    login2fa(payload: { tempToken: string; code: string }) {
        return apiClient.post<LoginResponse>('/auth/login/2fa', payload)
    },

    /**
     * 刷新 Token
     */
    refreshToken(refreshToken: string) {
        return apiClient.post<RefreshTokenResponse>('/auth/refresh', { refreshToken })
    },

    /**
     * 获取当前用户信息
     */
    getCurrentUser() {
        return apiClient.get<User>('/auth/me')
    },

    /**
     * 用户登出
     */
    logout() {
        return apiClient.post<void>('/auth/logout')
    },

    /**
     * 验证设置密码 Token
     */
    validateSetupToken(token: string) {
        return apiClient.get<User & { valid: boolean }>(`/auth/setup-password/${token}`)
    },

    /**
     * 首次登录设置密码
     */
    setupPassword(token: string, password: string) {
        return apiClient.post<LoginResponse & { success: boolean }>('/auth/setup-password', { token, password })
    },

    /**
     * 获取 2FA 二维码与私钥
     */
    generate2fa() {
        return apiClient.get<{ qrCode: string; secret: string }>('/auth/2fa/generate')
    },

    /**
     * 验证并开启 2FA
     */
    enable2fa(payload: { code: string }) {
        return apiClient.post<void>('/auth/2fa/enable', payload)
    },

    /**
     * 关闭 2FA
     */
    disable2fa(payload: { code: string }) {
        return apiClient.post<void>('/auth/2fa/disable', payload)
    },
}

export const projectApi = {
    /**
     * 获取我的项目列表
     */
    getMyProjects() {
        return apiClient.get<Project[]>('/projects/mine')
    },

    /**
     * 获取项目详情
     */
    getProjectById(id: string) {
        return apiClient.get<Project>(`/projects/${id}`)
    },

    /**
     * 获取项目进度
     */
    getProjectProgress(id: string) {
        return apiClient.get<unknown>(`/projects/${id}/progress`) // 进度暂保留 unknown，如有明确结构可替换
    },
}

export const documentApi = {
    /**
     * 获取我的文档列表
     */
    getMyDocuments(projectId?: string) {
        return apiClient.get<PortalDocument[]>('/documents/mine', { params: { projectId } })
    },

    /**
     * 上传文档
     */
    uploadDocument(formData: FormData) {
        return apiClient.post<PortalDocument>('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    /**
     * 下载文档
     */
    downloadDocument(id: string) {
        return apiClient.get<Blob>(`/documents/${id}/download`, { responseType: 'blob' })
    },
}

export const messageApi = {
    /**
     * 获取我的消息列表
     */
    getMyMessages() {
        return apiClient.get<PortalMessage[]>('/messages/mine')
    },

    /**
     * 标记消息为已读
     */
    markAsRead(id: string) {
        return apiClient.put<void>(`/messages/${id}/read`)
    },

    /**
     * 获取未读消息数量
     */
    getUnreadCount() {
        return apiClient.get<{ count: number }>('/messages/unread-count')
    },

    /**
     * 发送消息 (联系顾问)
     */
    sendMessage(data: { projectId: string; recipientId: string; title: string; content: string }) {
        return apiClient.post<PortalMessage>('/messages/contact', data)
    },
}

export const invoiceApi = {
    /**
     * 获取我的账单列表
     */
    getMyInvoices(params?: { page?: number; limit?: number; status?: string }) {
        return apiClient.get<PaginatedResponse<Invoice>>('/invoices', { params })
    },

    /**
     * 获取账单详情
     */
    getInvoiceById(id: string) {
        return apiClient.get<Invoice>(`/invoices/${id}`)
    }
}

/**
 * 客户门户专用 API（完全隔离）
 */
export const portalApi = {
    /**
     * 获取个人资料
     */
    getProfile() {
        return apiClient.get<User>('/portal/profile')
    },

    /**
     * 更新个人资料
     */
    updateProfile(data: { name?: string; phone?: string; company?: string }) {
        return apiClient.put<User>('/portal/profile', data)
    },

    /**
     * 修改密码
     */
    changePassword(data: { currentPassword: string; newPassword: string }) {
        return apiClient.post<void>('/portal/change-password', data)
    },

    /**
     * 获取仪表板统计
     */
    getDashboardStats() {
        return apiClient.get<PortalDashboardStats>('/portal/dashboard')
    },

    /**
     * 一键导出客户资料与账单记录 (Excel)
     */
    exportMyData() {
        return apiClient.get<Blob>('/portal/export-data', { responseType: 'blob' })
    },

    /**
     * 获取待办/通知列表
     */
    getNotifications() {
        return apiClient.get<unknown[]>('/portal/notifications') // 根据 Dashboard.vue 的 ActionItem，暂返回 unknown[]
    },

    /**
     * 获取我的项目（通过 portal 路由）
     */
    getMyProjects() {
        return apiClient.get<PortalProject[]>('/portal/projects')
    },

    /**
     * 获取项目详情
     */
    getProjectById(id: string) {
        return apiClient.get<PortalProject>(`/portal/projects/${id}`)
    },

    // ==================== 个人数字资产库 ====================

    /**
     * 拉取被授权的档案库及签署文件
     */
    getMyDocuments(params?: { page: number; limit: number }) {
        return apiClient.get<PaginatedResponse<PortalDocument>>('/portal/documents', { params })
    },

    /**
     * 简易签署同意书/文案
     */
    signDocument(documentId: string, signatureData: string) {
        return apiClient.post<PortalDocument>(`/portal/documents/${documentId}/sign`, { signatureData })
    },

    // ==================== 帮助中心与知识库 ====================

    /**
     * 获取知识库分类及问答记录
     */
    getFaqs() {
        return apiClient.get<FaqCategory[]>('/portal/faqs')
    },

    /**
     * 对帮助条例点赞 (设为有用)
     */
    markFaqHelpful(id: string) {
        return apiClient.post<void>(`/portal/faqs/${id}/helpful`)
    },

    // ==================== 站内消息接口 ====================

    /**
     * 获取站内消息列表
     */
    getMessages(params?: { page?: number; limit?: number; isRead?: boolean; type?: string }) {
        return apiClient.get<PaginatedResponse<PortalMessage>>('/portal/messages', { params })
    },

    /**
     * 获取未读消息数量
     */
    getUnreadCount() {
        return apiClient.get<{ count: number }>('/portal/messages/unread-count')
    },

    /**
     * 获取消息详情
     */
    getMessageById(id: string) {
        return apiClient.get<PortalMessage>(`/portal/messages/${id}`)
    },

    /**
     * 标记消息为已读
     */
    markMessageAsRead(id: string) {
        return apiClient.put<void>(`/portal/messages/${id}/read`)
    },

    /**
     * 全部标记为已读
     */
    markAllMessagesAsRead() {
        return apiClient.post<void>('/portal/messages/mark-all-read')
    },

    /**
     * 删除消息
     */
    deleteMessage(id: string) {
        return apiClient.delete<void>(`/portal/messages/${id}`)
    },

    // ==================== 服务咨询接口 ====================

    /**
     * 创建服务咨询
     */
    createInquiry(data: {
        serviceType: string
        name?: string
        phone?: string
        email?: string
        message: string
        preferredContact?: string
    }) {
        return apiClient.post<IdResponse>('/portal/inquiries', data)
    },

    /**
     * 发起预约会议请求 (向专属顾问)
     */
    bookAppointment(data: { title: string; description?: string; startTime: string; endTime: string; userId: string; projectId?: string }) {
        return apiClient.post<IdResponse>('/portal/appointments', data)
    },

    // ==================== 家庭成员接口 ====================

    /**
     * 添加家庭成员
     */
    addFamilyMember(data: { name: string; relationship: string; isBeneficiary?: boolean }) {
        return apiClient.post<IdResponse>('/portal/family-members', data)
    },

    /**
     * 更新家庭成员
     */
    updateFamilyMember(id: string, data: { name?: string; relationship?: string; isBeneficiary?: boolean }) {
        return apiClient.put<void>(`/portal/family-members/${id}`, data)
    },

    /**
     * 删除家庭成员
     */
    deleteFamilyMember(id: string) {
        return apiClient.delete<void>(`/portal/family-members/${id}`)
    },

    // ==================== 通知偏好接口 ====================

    /**
     * 保存通知偏好
     */
    updatePreferences(preferences: {
        email?: boolean
        sms?: boolean
        projectUpdate?: boolean
        documentReminder?: boolean
    }) {
        return apiClient.put<void>('/portal/preferences', preferences)
    },
}

export { default as apiClient } from './apiClient'
