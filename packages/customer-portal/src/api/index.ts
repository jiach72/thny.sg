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

// ==================== 门户专用响应类型 ====================
// 后端各分页端点返回格式不统一，此处定义与后端实际返回一致的类型

/** 后端 messageService.getMessages 返回格式 */
interface PortalMessageListResponse {
    messages: PortalMessage[]
    total: number
    page: number
    limit: number
    totalPages: number
}

/** 后端 portalService.getDocuments 返回格式 */
interface PortalDocumentListResponse {
    documents: PortalDocument[]
    total: number
    page: number
    limit: number
    totalPages: number
}

/** 后端 portalService.addFamilyMember 返回格式 */
interface AddFamilyMemberResponse {
    success: boolean
    message: string
    member: { id: string; name: string; relationship: string; isBeneficiary: boolean }
}

interface PaymentHistoryItem {
    id: string
    invoiceId: string
    amount: number
    currency: string
    status: string
    method: string
    paidAt: string
    createdAt: string
}

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

/** @deprecated 请使用 portalApi.getInvoices / portalApi.getInvoice，路由已迁移至 /portal/invoices */
export const invoiceApi = {
    getMyInvoices(params?: { page?: number; limit?: number; status?: string }) {
        return apiClient.get<PaginatedResponse<Invoice>>('/invoices', { params })
    },

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
     * 后端返回 { documents, total, page, limit, totalPages }，非标准 PaginatedResponse
     */
    getMyDocuments(params?: { page: number; limit: number }) {
        return apiClient.get<PortalDocumentListResponse>('/portal/documents', { params })
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
     * 后端返回 { messages, total, page, limit, totalPages }，非标准 PaginatedResponse
     */
    getMessages(params?: { page?: number; limit?: number; isRead?: boolean; type?: string }) {
        return apiClient.get<PortalMessageListResponse>('/portal/messages', { params })
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

    getInvoices(params?: { page?: number; limit?: number; status?: string }) {
        return apiClient.get<PaginatedResponse<Invoice>>('/portal/invoices', { params })
    },

    getInvoice(id: string) {
        return apiClient.get<Invoice>(`/portal/invoices/${id}`)
    },

    downloadInvoicePdf(id: string) {
        return apiClient.get<Blob>(`/portal/invoices/${id}/pdf`, { responseType: 'blob' })
    },

    uploadDocument(formData: FormData) {
        return apiClient.post<PortalDocument>('/portal/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    downloadDocument(id: string) {
        return apiClient.get<Blob>(`/portal/documents/${id}/download`, { responseType: 'blob' })
    },

    getDocumentVersions(id: string) {
        return apiClient.get<PortalDocument[]>(`/portal/documents/${id}/versions`)
    },

    getAppointments(params?: { page?: number; limit?: number }) {
        return apiClient.get<{ appointments: { id: string; title: string; startTime: string; endTime: string; status: string }[]; total: number }>('/portal/appointments', { params })
    },

    cancelAppointment(id: string) {
        return apiClient.delete<void>(`/portal/appointments/${id}`)
    },

    deleteAccount() {
        return apiClient.delete<void>('/portal/account')
    },

    // ==================== 家庭成员接口 ====================

    /**
     * 添加家庭成员
     * 后端返回 { success, message, member }，非标准 IdResponse
     */
    addFamilyMember(data: { name: string; relationship: string; isBeneficiary?: boolean }) {
        return apiClient.post<AddFamilyMemberResponse>('/portal/family-members', data)
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

    // ==================== 在线支付接口 ====================

    createPaymentCheckout(invoiceId: string) {
        return apiClient.post<{ url: string; sessionId: string }>('/portal/payments/create-checkout', { invoiceId })
    },

    getPaymentHistory() {
        return apiClient.get<PaymentHistoryItem[]>('/portal/payments/history')
    },

    // ==================== 实时聊天接口 ====================

    getChatRooms() {
        return apiClient.get<{ id: string; name: string; lastMessage?: string; unreadCount: number }[]>('/portal/chat/rooms')
    },

    getChatMessages(roomId: string, params?: { page?: number; limit?: number }) {
        return apiClient.get<{ id: string; content: string; sender: string; createdAt: string }[]>(`/portal/chat/rooms/${roomId}/messages`, { params })
    },

    sendChatMessage(roomId: string, content: string) {
        return apiClient.post<{ id: string; content: string; createdAt: string }>(`/portal/chat/rooms/${roomId}/messages`, { content })
    },

    // ==================== 电子签名接口 ====================

    getSignatureRequests(projectId: string) {
        return apiClient.get<{ id: string; documentId: string; status: string; createdAt: string }[]>('/portal/signatures', { params: { projectId } })
    },

    createSignatureRequest(data: { documentId: string; projectId: string; signerEmail: string }) {
        return apiClient.post<{ id: string; status: string }>('/portal/signatures', data)
    },

    completeSignature(requestId: string, signatureData: string) {
        return apiClient.post<{ id: string; status: string; completedAt: string }>(`/portal/signatures/${requestId}/complete`, { signatureData })
    },

    // ==================== AI文档助手接口 ====================

    getDocumentChecklist(params: { projectType?: string; projectId?: string }) {
        return apiClient.get<{ required: string[]; missing: string[]; uploaded: string[]; total: number }>('/portal/documents/checklist', { params })
    },

    // ==================== 工单系统接口 ====================

    createTicket(data: { title: string; type: string; priority: string; description: string }) {
        return apiClient.post<{ id: string; status: string }>('/portal/tickets', data)
    },

    getTickets(params?: { page?: number; limit?: number; status?: string }) {
        return apiClient.get<{ data: { id: string; title: string; status: string; priority: string; createdAt: string }[]; total: number }>('/portal/tickets', { params })
    },

    getTicket(id: string) {
        return apiClient.get<{ id: string; title: string; description: string; status: string; priority: string; replies: { id: string; content: string; createdAt: string }[] }>(`/portal/tickets/${id}`)
    },

    replyTicket(id: string, content: string) {
        return apiClient.post<{ id: string; content: string; createdAt: string }>(`/portal/tickets/${id}/reply`, { content })
    },

    closeTicket(id: string) {
        return apiClient.post<{ id: string; status: string }>(`/portal/tickets/${id}/close`)
    },

    rateTicket(id: string, rating: number, comment: string) {
        return apiClient.post<{ id: string; rating: number }>(`/portal/tickets/${id}/rate`, { rating, comment })
    },

    // ==================== 知识库/资源中心接口 ====================

    getResources(params?: { category?: string; type?: string; keyword?: string }) {
        return apiClient.get<{ data: { id: string; title: string; category: string; type: string }[]; total: number }>('/portal/resources', { params })
    },

    getResource(id: string) {
        return apiClient.get<{ id: string; title: string; content: string; category: string }>(`/portal/resources/${id}`)
    },

    // ==================== 项目协作空间接口 ====================

    getProjectDiscussions(projectId: string) {
        return apiClient.get<{ id: string; content: string; author: string; createdAt: string }[]>(`/portal/projects/${projectId}/discussions`)
    },

    sendDiscussionMessage(projectId: string, data: { content: string }) {
        return apiClient.post<{ id: string; content: string; createdAt: string }>(`/portal/projects/${projectId}/discussions`, data)
    },

    getProjectFiles(projectId: string) {
        return apiClient.get<{ id: string; name: string; size: number; type: string; createdAt: string }[]>(`/portal/projects/${projectId}/files`)
    },

    uploadProjectFile(projectId: string, formData: FormData) {
        return apiClient.post<{ id: string; name: string; url: string }>(`/portal/projects/${projectId}/files`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    getProjectApprovals(projectId: string) {
        return apiClient.get<{ id: string; title: string; status: string; createdAt: string }[]>(`/portal/projects/${projectId}/approvals`)
    },

    submitApproval(approvalId: string, action: string, comment: string) {
        return apiClient.post<{ id: string; status: string }>(`/portal/approvals/${approvalId}/submit`, { action, comment })
    },

    // ==================== 客户评分/反馈接口 ====================

    getFeedbackList() {
        return apiClient.get<{ id: string; project: string; score: number; comment: string; createdAt: string }[]>('/portal/feedback')
    },

    submitFeedback(projectId: string, data: { overallScore: number; professionalism: number; responsiveness: number; communication: number; valueForMoney: number; nps: number; comment: string }) {
        return apiClient.post<{ id: string; success: boolean }>(`/portal/projects/${projectId}/feedback`, data)
    },

    getFeedbackStats() {
        return apiClient.get<{ averageScore: number; totalReviews: number; nps: number }>('/portal/feedback/stats')
    },

    // ==================== 数据看板接口 ====================

    getAnalyticsOverview(params: { period: string }) {
        return apiClient.get<{ totalProjects: number; activeProjects: number; totalExpenses: number; pendingInvoices: number }>('/portal/analytics/overview', { params })
    },

    getExpenseTrend(params: { period: string }) {
        return apiClient.get<{ date: string; amount: number }[]>('/portal/analytics/expense-trend', { params })
    },

    getProjectProgress() {
        return apiClient.get<{ id: string; name: string; progress: number }[]>('/portal/analytics/project-progress')
    },

    getDocumentStats() {
        return apiClient.get<{ total: number; uploaded: number; pending: number }>('/portal/analytics/document-stats')
    },

    getInvoiceStats() {
        return apiClient.get<{ total: number; paid: number; pending: number; overdue: number }>('/portal/analytics/invoice-stats')
    },
}

export { default as apiClient } from './apiClient'
