import apiClient from './apiClient'

// ==================== 发票管理 ====================

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED'
export type Currency = 'SGD' | 'USD' | 'RMB' | 'MYR'

export interface InvoiceItem {
    description: string
    quantity: number
    unitPrice: number
    amount: number
}

export interface Invoice {
    id: string
    invoiceNumber: string
    projectId?: string
    project?: {
        id: string
        name: string
    }
    customerId: string
    customer?: {
        id: string
        companyName: string
        contactName: string
    }
    items: InvoiceItem[]
    subtotal: number
    taxRate: number
    taxAmount: number
    totalAmount: number
    currency: Currency
    status: InvoiceStatus
    issueDate: string
    dueDate: string
    paidAmount: number
    notes?: string
    createdBy?: {
        id: string
        name: string
    }
    createdAt: string
    updatedAt: string
}

export interface Payment {
    id: string
    invoiceId: string
    amount: number
    currency: Currency
    exchangeRate: number
    amountInInvoiceCurrency: number
    paymentMethod: string
    paymentDate: string
    reference?: string
    notes?: string
    recordedBy?: {
        id: string
        name: string
    }
    createdAt: string
}

export interface CreateInvoiceInput {
    projectId?: string
    customerId: string
    items: InvoiceItem[]
    taxRate?: number
    currency?: Currency
    dueDate: string
    notes?: string
}

export interface UpdateInvoiceInput {
    items?: InvoiceItem[]
    taxRate?: number
    currency?: Currency
    dueDate?: string
    notes?: string
}

export interface CreatePaymentInput {
    amount: number
    currency?: Currency
    exchangeRate?: number
    paymentMethod: string
    paymentDate: string
    reference?: string
    notes?: string
}

export interface InvoiceStats {
    total: number
    totalAmount: number
    byStatus: Record<InvoiceStatus, { count: number; amount: number }>
}

// 获取发票列表
export const getInvoices = (filters?: { status?: InvoiceStatus; customerId?: string; projectId?: string }, pagination?: { page: number; limit: number }): Promise<{ data: Invoice[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> =>
    apiClient.get('/invoices', {
        params: { ...filters, ...pagination }
    })

// 获取发票详情
export const getInvoiceById = (id: string): Promise<Invoice> =>
    apiClient.get(`/invoices/${id}`)

// 创建发票
export const createInvoice = (data: CreateInvoiceInput): Promise<Invoice> =>
    apiClient.post('/invoices', data)

// 更新发票
export const updateInvoice = (id: string, data: UpdateInvoiceInput): Promise<Invoice> =>
    apiClient.put(`/invoices/${id}`, data)

// 删除发票
export const deleteInvoice = (id: string): Promise<void> =>
    apiClient.delete(`/invoices/${id}`)

// 发送发票
export const sendInvoice = (id: string): Promise<Invoice> =>
    apiClient.post(`/invoices/${id}/send`)

// 取消发票
export const cancelInvoice = (id: string): Promise<Invoice> =>
    apiClient.post(`/invoices/${id}/cancel`)

// 获取付款记录
export const getPayments = (invoiceId: string): Promise<Payment[]> =>
    apiClient.get(`/invoices/${invoiceId}/payments`)

// 创建付款记录
export const createPayment = (invoiceId: string, data: CreatePaymentInput): Promise<Payment> =>
    apiClient.post(`/invoices/${invoiceId}/payments`, data)

// 删除付款记录
export const deletePayment = (paymentId: string): Promise<void> =>
    apiClient.delete(`/invoices/payments/${paymentId}`)

// 获取发票统计
export const getInvoiceStats = (): Promise<InvoiceStats> =>
    apiClient.get('/invoices/stats')

// 检查逾期发票
export const checkOverdueInvoices = (): Promise<Invoice[]> =>
    apiClient.post('/invoices/check-overdue')

export default {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    cancelInvoice,
    getPayments,
    createPayment,
    deletePayment,
    getInvoiceStats,
    checkOverdueInvoices
}

