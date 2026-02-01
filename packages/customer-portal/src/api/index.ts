import apiClient from './apiClient'

export const authApi = {
    /**
     * 客户登录
     */
    login(payload: { email: string; password: string }) {
        return apiClient.post('/auth/login', payload)
    },

    /**
     * 刷新 Token
     */
    refreshToken(refreshToken: string) {
        return apiClient.post('/auth/refresh', { refreshToken })
    },

    /**
     * 获取当前用户信息
     */
    getCurrentUser() {
        return apiClient.get('/auth/me')
    },

    /**
     * 用户登出
     */
    logout() {
        return apiClient.post('/auth/logout')
    },

    /**
     * 验证设置密码 Token
     */
    validateSetupToken(token: string) {
        return apiClient.get(`/auth/setup-password/${token}`)
    },

    /**
     * 首次登录设置密码
     */
    setupPassword(token: string, password: string) {
        return apiClient.post('/auth/setup-password', { token, password })
    },
}

export const projectApi = {
    /**
     * 获取我的项目列表
     */
    getMyProjects() {
        return apiClient.get('/projects/mine')
    },

    /**
     * 获取项目详情
     */
    getProjectById(id: string) {
        return apiClient.get(`/projects/${id}`)
    },

    /**
     * 获取项目进度
     */
    getProjectProgress(id: string) {
        return apiClient.get(`/projects/${id}/progress`)
    },
}

export const documentApi = {
    /**
     * 获取我的文档列表
     */
    getMyDocuments(projectId?: string) {
        return apiClient.get('/documents/mine', { params: { projectId } })
    },

    /**
     * 上传文档
     */
    uploadDocument(formData: FormData) {
        return apiClient.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    /**
     * 下载文档
     */
    downloadDocument(id: string) {
        return apiClient.get(`/documents/${id}/download`, { responseType: 'blob' })
    },
}

export const messageApi = {
    /**
     * 获取我的消息列表
     */
    getMyMessages() {
        return apiClient.get('/messages/mine')
    },

    /**
     * 标记消息为已读
     */
    markAsRead(id: string) {
        return apiClient.put(`/messages/${id}/read`)
    },

    /**
     * 获取未读消息数量
     */
    getUnreadCount() {
        return apiClient.get('/messages/unread-count')
    },

    /**
     * 发送消息 (联系顾问)
     */
    sendMessage(data: { projectId: string; recipientId: string; title: string; content: string }) {
        return apiClient.post('/messages/contact', data)
    },
}

/**
 * 客户门户专用 API（完全隔离）
 */
export const portalApi = {
    /**
     * 获取个人资料
     */
    getProfile() {
        return apiClient.get('/portal/profile')
    },

    /**
     * 更新个人资料
     */
    updateProfile(data: { name?: string; phone?: string; company?: string }) {
        return apiClient.put('/portal/profile', data)
    },

    /**
     * 修改密码
     */
    changePassword(data: { currentPassword: string; newPassword: string }) {
        return apiClient.post('/portal/change-password', data)
    },

    /**
     * 获取仪表板统计
     */
    getDashboardStats() {
        return apiClient.get('/portal/dashboard')
    },

    /**
     * 获取待办/通知列表
     */
    getNotifications() {
        return apiClient.get('/portal/notifications')
    },

    /**
     * 获取我的项目（通过 portal 路由）
     */
    getMyProjects() {
        return apiClient.get('/portal/projects')
    },

    /**
     * 获取项目详情
     */
    getProjectById(id: string) {
        return apiClient.get(`/portal/projects/${id}`)
    },

    // ==================== 站内消息接口 ====================

    /**
     * 获取站内消息列表
     */
    getMessages(params?: { page?: number; limit?: number; isRead?: boolean; type?: string }) {
        return apiClient.get('/portal/messages', { params })
    },

    /**
     * 获取未读消息数量
     */
    getUnreadCount() {
        return apiClient.get('/portal/messages/unread-count')
    },

    /**
     * 获取消息详情
     */
    getMessageById(id: string) {
        return apiClient.get(`/portal/messages/${id}`)
    },

    /**
     * 标记消息为已读
     */
    markMessageAsRead(id: string) {
        return apiClient.put(`/portal/messages/${id}/read`)
    },

    /**
     * 全部标记为已读
     */
    markAllMessagesAsRead() {
        return apiClient.post('/portal/messages/mark-all-read')
    },

    /**
     * 删除消息
     */
    deleteMessage(id: string) {
        return apiClient.delete(`/portal/messages/${id}`)
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
        return apiClient.post('/portal/inquiries', data)
    },

    // ==================== 家庭成员接口 ====================

    /**
     * 添加家庭成员
     */
    addFamilyMember(data: { name: string; relationship: string; isBeneficiary?: boolean }) {
        return apiClient.post('/portal/family-members', data)
    },

    /**
     * 更新家庭成员
     */
    updateFamilyMember(id: string, data: { name?: string; relationship?: string; isBeneficiary?: boolean }) {
        return apiClient.put(`/portal/family-members/${id}`, data)
    },

    /**
     * 删除家庭成员
     */
    deleteFamilyMember(id: string) {
        return apiClient.delete(`/portal/family-members/${id}`)
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
        return apiClient.put('/portal/preferences', preferences)
    },
}

export { default as apiClient } from './apiClient'
