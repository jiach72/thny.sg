import apiClient from './apiClient'

// ==================== 邮件模板管理 ====================

export interface EmailTemplate {
    id: string
    name: string
    subject: string
    body: string
    category: string
    description?: string
    variables: string[]
    isActive: boolean
    createdBy?: {
        id: string
        name: string
    }
    createdAt: string
    updatedAt: string
}

export interface EmailLog {
    id: string
    recipient: string
    subject: string
    body: string
    status: 'PENDING' | 'SENT' | 'FAILED'
    sentAt?: string
    errorMsg?: string
    template?: {
        id: string
        name: string
    }
    sentBy?: {
        id: string
        name: string
    }
    createdAt: string
}

export interface CreateTemplateInput {
    name: string
    subject: string
    body: string
    category?: string
    description?: string
    variables?: string[]
}

export interface UpdateTemplateInput {
    name?: string
    subject?: string
    body?: string
    category?: string
    description?: string
    variables?: string[]
    isActive?: boolean
}

export interface PreviewResult {
    subject: string
    body: string
    originalTemplate: EmailTemplate
}

export interface SendEmailInput {
    recipient: string
    subject: string
    body: string
    leadId?: string
    customerId?: string
}

// 获取所有模板
export const getTemplates = (category?: string, includeInactive = false): Promise<EmailTemplate[]> =>
    apiClient.get('/email-templates', {
        params: { category, includeInactive }
    })

// 获取模板详情
export const getTemplateById = (id: string): Promise<EmailTemplate> =>
    apiClient.get(`/email-templates/${id}`)

// 创建模板
export const createTemplate = (data: CreateTemplateInput): Promise<EmailTemplate> =>
    apiClient.post('/email-templates', data)

// 更新模板
export const updateTemplate = (id: string, data: UpdateTemplateInput): Promise<EmailTemplate> =>
    apiClient.put(`/email-templates/${id}`, data)

// 删除模板
export const deleteTemplate = (id: string): Promise<void> =>
    apiClient.delete(`/email-templates/${id}`)

// 预览模板
export const previewTemplate = (id: string, context: any): Promise<PreviewResult> =>
    apiClient.post(`/email-templates/${id}/preview`, { context })

// 使用模板发送邮件
export const sendWithTemplate = (id: string, data: { recipient: string; context?: any; leadId?: string; customerId?: string }): Promise<any> =>
    apiClient.post(`/email-templates/${id}/send`, data)

// 直接发送邮件
export const sendDirectEmail = (data: SendEmailInput): Promise<any> =>
    apiClient.post('/email-templates/send-direct', data)

// 获取发送记录
export const getEmailLogs = (filters?: { leadId?: string; customerId?: string; templateId?: string; status?: string }, pagination?: { page: number; limit: number }): Promise<{ data: EmailLog[]; pagination: any }> =>
    apiClient.get('/email-templates/logs', {
        params: { ...filters, ...pagination }
    })

// 初始化默认模板
export const seedDefaultTemplates = (): Promise<void> =>
    apiClient.post('/email-templates/seed')

export default {
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    previewTemplate,
    sendWithTemplate,
    sendDirectEmail,
    getEmailLogs,
    seedDefaultTemplates
}

