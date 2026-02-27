import apiClient from './apiClient'

export interface SendMessagePayload {
    recipientId: string
    title: string
    content: string
    type?: 'SYSTEM' | 'PROJECT' | 'DOCUMENT' | 'PAYMENT' | 'REMINDER' | 'ANNOUNCEMENT'
    projectId?: string
}

export interface SendBulkMessagePayload {
    recipientIds: string[]
    title: string
    content: string
    type?: 'ANNOUNCEMENT' | 'SYSTEM'
}

export const messageApi = {
    /**
     * 发送站内消息
     */
    send(payload: SendMessagePayload) {
        return apiClient.post('/messages/send', payload)
    },

    /**
     * 批量发送消息
     */
    sendBulk(payload: SendBulkMessagePayload) {
        return apiClient.post('/messages/send-bulk', payload)
    },

    /**
     * 获取已发送的消息列表
     */
    getSentMessages(page = 1, limit = 20) {
        return apiClient.get('/messages/sent', { params: { page, limit } })
    },

    /**
     * 获取可发送消息的客户列表
     */
    getCustomers() {
        return apiClient.get('/messages/customers')
    },

    /**
     * 获取当前用户的收件箱消息（分页）
     */
    getMyMessages(page = 1, limit = 20, isRead?: boolean) {
        return apiClient.get('/messages/mine', { params: { page, limit, isRead } })
    },

    /**
     * 将单条消息标记为已读
     */
    markAsRead(id: string) {
        return apiClient.put(`/messages/${id}/read`)
    },

    /**
     * 批量标记所有消息为已读
     */
    markAllAsRead() {
        return apiClient.put('/messages/read-all')
    },

    /**
     * 删除我的消息
     */
    deleteMessage(id: string) {
        return apiClient.delete(`/messages/${id}`)
    },
}

export default messageApi
