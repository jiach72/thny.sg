import http from '../utils/request'
import type {
  User,
  PortalDashboardStats,
  PortalProject,
  PortalDocument,
  PortalMessage,
  PaginatedResponse,
  IdResponse,
  Invoice,
  FaqCategory,
} from '@tonghai/shared'

// ==================== 客户门户核心 API ====================

export const portalApi = {
  getProfile() {
    return http.get<User>('/portal/profile')
  },
  updateProfile(data: { name?: string; phone?: string; company?: string }) {
    return http.put<User>('/portal/profile', data)
  },
  changePassword(data: { currentPassword: string; newPassword: string }) {
    return http.post<void>('/portal/change-password', data)
  },
  getDashboardStats() {
    return http.get<PortalDashboardStats>('/portal/dashboard')
  },
  getMyProjects() {
    return http.get<PortalProject[]>('/portal/projects')
  },
  getProjectById(id: string) {
    return http.get<PortalProject>(`/portal/projects/${id}`)
  },

  // 文档
  getMyDocuments(params?: { page: number; limit: number }) {
    return http.get<PaginatedResponse<PortalDocument>>('/portal/documents', params)
  },
  signDocument(documentId: string, signatureData: string) {
    return http.post<PortalDocument>(`/portal/documents/${documentId}/sign`, { signatureData })
  },

  // 消息
  getMessages(params?: { page?: number; limit?: number; isRead?: boolean; type?: string }) {
    return http.get<PaginatedResponse<PortalMessage>>('/portal/messages', params)
  },
  getUnreadCount() {
    return http.get<{ count: number }>('/portal/messages/unread-count')
  },
  getMessageById(id: string) {
    return http.get<PortalMessage>(`/portal/messages/${id}`)
  },
  markMessageAsRead(id: string) {
    return http.put<void>(`/portal/messages/${id}/read`)
  },
  markAllMessagesAsRead() {
    return http.post<void>('/portal/messages/mark-all-read')
  },
  deleteMessage(id: string) {
    return http.del<void>(`/portal/messages/${id}`)
  },

  // FAQ
  getFaqs() {
    return http.get<FaqCategory[]>('/portal/faqs')
  },
  markFaqHelpful(id: string) {
    return http.post<void>(`/portal/faqs/${id}/helpful`)
  },

  // 通知
  getNotifications() {
    return http.get<any[]>('/portal/notifications')
  },

  // 咨询与预约
  createInquiry(data: { serviceType: string; message: string; name?: string; phone?: string; email?: string }) {
    return http.post<IdResponse>('/portal/inquiries', data)
  },
  bookAppointment(data: { title: string; startTime: string; endTime: string; userId: string; projectId?: string }) {
    return http.post<IdResponse>('/portal/appointments', data)
  },

  // 偏好
  updatePreferences(prefs: { email?: boolean; sms?: boolean; projectUpdate?: boolean; documentReminder?: boolean }) {
    return http.put<void>('/portal/preferences', prefs)
  },
  getPreferences() {
    return http.get<{ email: boolean; sms: boolean; projectUpdate: boolean; documentReminder: boolean }>('/portal/preferences')
  },
  
  // 导出数据
  exportMyData() {
    return http.get<any>('/portal/export-data')
  },

  // 家庭成员
  addFamilyMember(data: { name: string; relationship: string; isBeneficiary?: boolean }) {
    return http.post<IdResponse>('/portal/family-members', data)
  },
  updateFamilyMember(id: string, data: { name?: string; relationship?: string; isBeneficiary?: boolean }) {
    return http.put<void>(`/portal/family-members/${id}`, data)
  },
  deleteFamilyMember(id: string) {
    return http.del<void>(`/portal/family-members/${id}`)
  },
}

// ==================== 账单 API ====================

export const invoiceApi = {
  getMyInvoices(params?: { page?: number; limit?: number; status?: string }) {
    return http.get<PaginatedResponse<Invoice>>('/invoices', params)
  },
  getInvoiceById(id: string) {
    return http.get<Invoice>(`/invoices/${id}`)
  },
}

// ==================== 文档下载 API ====================

export const documentApi = {
  downloadDocument(id: string) {
    return http.get<any>(`/documents/${id}/download`)
  },
  uploadDocument(formData: FormData) {
    return http.post<PortalDocument>('/documents/upload', formData)
  },
}

// ==================== 鉴权扩展 API ====================

export const authApi = {
  getCurrentUser() {
    return http.get<User>('/auth/me')
  },
  generate2fa() {
    return http.get<{ qrCode: string; secret: string }>('/auth/2fa/generate')
  },
  enable2fa(payload: { code: string }) {
    return http.post<void>('/auth/2fa/enable', payload)
  },
  disable2fa(payload: { code: string }) {
    return http.post<void>('/auth/2fa/disable', payload)
  },
  forgotPassword(email: string) {
    return http.post<void>('/auth/forgot-password', { email })
  },
  resetPassword(data: { token: string; password: string }) {
    return http.post<void>('/auth/reset-password', data)
  },
}

