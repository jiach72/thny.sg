// 发票状态
export type InvoiceStatus =
    | 'DRAFT'
    | 'SENT'
    | 'PARTIAL'
    | 'PAID'
    | 'CANCELLED'
    | 'OVERDUE'

// 发票明细行
export interface InvoiceLineItem {
    description: string
    quantity: number
    unitPrice: number
    amount: number
}

// 发票实体
export interface Invoice {
    id: string
    invoiceNumber: string
    projectId: string
    customerId: string
    title: string
    items: InvoiceLineItem[]
    subtotal: number
    taxRate: number
    taxAmount: number
    totalAmount: number
    currency: string
    status: InvoiceStatus
    paidAmount: number
    issueDate: string
    dueDate: string
    notes?: string
    terms?: string
    createdById?: string
    createdAt: string
    updatedAt: string
    deletedAt?: string
    // 关联数据（仅在详情接口返回）
    project?: { id: string; title?: string }
    payments?: Payment[]
}

// 付款记录
export interface Payment {
    id: string
    invoiceId: string
    amount: number
    method: string
    reference?: string
    paidAt: string
    createdAt: string
}

// 创建发票请求
export interface CreateInvoicePayload {
    projectId: string
    customerId: string
    title: string
    items: InvoiceLineItem[]
    currency?: string
    taxRate?: number
    issueDate: string
    dueDate: string
    notes?: string
    terms?: string
}

// 更新发票请求
export interface UpdateInvoicePayload {
    title?: string
    items?: InvoiceLineItem[]
    taxRate?: number
    status?: InvoiceStatus
    issueDate?: string
    dueDate?: string
    notes?: string
    terms?: string
}
