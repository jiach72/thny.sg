import { prisma } from '../config/index.js'
import { Decimal } from '@prisma/client/runtime/library'

interface InvoiceItem {
    description: string
    quantity: number
    unitPrice: number
    amount: number
}

interface CreateInvoiceInput {
    projectId: string
    customerId: string
    title: string
    items: InvoiceItem[]
    taxRate?: number
    currency?: string
    issueDate: string
    dueDate: string
    notes?: string
    terms?: string
}

interface UpdateInvoiceInput {
    title?: string
    items?: InvoiceItem[]
    taxRate?: number
    issueDate?: string
    dueDate?: string
    notes?: string
    terms?: string
    status?: string
}

interface CreatePaymentInput {
    invoiceId: string
    amount: number
    currency?: string
    exchangeRate?: number
    paymentMethod: string
    paymentDate: string
    reference?: string
    notes?: string
    attachmentUrl?: string
}

export const invoiceService = {
    // ==================== 发票管理 ====================

    /**
     * 生成发票号
     */
    async generateInvoiceNumber(): Promise<string> {
        const year = new Date().getFullYear()
        const month = String(new Date().getMonth() + 1).padStart(2, '0')

        // 获取当月发票数量
        const count = await prisma.invoice.count({
            where: {
                invoiceNumber: {
                    startsWith: `INV-${year}${month}`
                }
            }
        })

        const sequence = String(count + 1).padStart(4, '0')
        return `INV-${year}${month}-${sequence}`
    },

    /**
     * 获取发票列表
     */
    async getInvoices(filters: {
        projectId?: string
        customerId?: string
        status?: string
    }, pagination: { page: number; limit: number }) {
        const { page, limit } = pagination
        const skip = (page - 1) * limit

        const where: any = {}
        if (filters.projectId) where.projectId = filters.projectId
        if (filters.customerId) where.customerId = filters.customerId
        if (filters.status) where.status = filters.status

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    project: { select: { id: true, title: true } },
                    createdBy: { select: { id: true, name: true } },
                    _count: { select: { payments: true } }
                }
            }),
            prisma.invoice.count({ where })
        ])

        return {
            data: invoices,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    },

    /**
     * 获取发票详情
     */
    async getInvoiceById(id: string) {
        return prisma.invoice.findUnique({
            where: { id },
            include: {
                project: { select: { id: true, title: true, customer: true } },
                createdBy: { select: { id: true, name: true } },
                payments: {
                    orderBy: { paymentDate: 'desc' },
                    include: {
                        recordedBy: { select: { id: true, name: true } }
                    }
                }
            }
        })
    },

    /**
     * 创建发票
     */
    async createInvoice(data: CreateInvoiceInput, creatorId?: string) {
        const invoiceNumber = await this.generateInvoiceNumber()

        // 计算金额
        const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0)
        const taxRate = data.taxRate || 0
        const taxAmount = subtotal * taxRate
        const totalAmount = subtotal + taxAmount

        return prisma.invoice.create({
            data: {
                invoiceNumber,
                projectId: data.projectId,
                customerId: data.customerId,
                title: data.title,
                items: data.items as any,
                subtotal: new Decimal(subtotal),
                taxRate: new Decimal(taxRate),
                taxAmount: new Decimal(taxAmount),
                totalAmount: new Decimal(totalAmount),
                currency: data.currency || 'SGD',
                issueDate: new Date(data.issueDate),
                dueDate: new Date(data.dueDate),
                notes: data.notes,
                terms: data.terms,
                createdById: creatorId
            },
            include: {
                project: { select: { id: true, title: true } }
            }
        })
    },

    /**
     * 更新发票
     */
    async updateInvoice(id: string, data: UpdateInvoiceInput) {
        const updateData: any = { ...data }

        // 如果更新了明细项，重新计算金额
        if (data.items) {
            const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0)
            const invoice = await this.getInvoiceById(id)
            const taxRate = data.taxRate ?? (invoice as any)?.taxRate ?? 0
            const taxAmount = subtotal * Number(taxRate)
            const totalAmount = subtotal + taxAmount

            updateData.subtotal = new Decimal(subtotal)
            updateData.taxAmount = new Decimal(taxAmount)
            updateData.totalAmount = new Decimal(totalAmount)
        }

        if (data.issueDate) updateData.issueDate = new Date(data.issueDate)
        if (data.dueDate) updateData.dueDate = new Date(data.dueDate)
        if (data.taxRate !== undefined) updateData.taxRate = new Decimal(data.taxRate)

        return prisma.invoice.update({
            where: { id },
            data: updateData
        })
    },

    /**
     * 删除发票
     */
    async deleteInvoice(id: string) {
        // 检查是否有收款记录
        const payments = await prisma.payment.count({ where: { invoiceId: id } })
        if (payments > 0) {
            throw new Error('无法删除已有收款记录的发票')
        }

        return prisma.invoice.delete({ where: { id } })
    },

    /**
     * 发送发票
     */
    async sendInvoice(id: string) {
        return prisma.invoice.update({
            where: { id },
            data: { status: 'SENT' }
        })
    },

    /**
     * 取消发票
     */
    async cancelInvoice(id: string) {
        return prisma.invoice.update({
            where: { id },
            data: { status: 'CANCELLED' }
        })
    },

    // ==================== 收款管理 ====================

    /**
     * 记录收款
     */
    async recordPayment(data: CreatePaymentInput, recorderId?: string) {
        const invoice = await this.getInvoiceById(data.invoiceId)
        if (!invoice) {
            throw new Error('发票不存在')
        }

        if (invoice.status === 'CANCELLED') {
            throw new Error('无法为已取消的发票记录收款')
        }

        if (invoice.status === 'PAID') {
            throw new Error('发票已全额付款')
        }

        // 计算发票货币金额
        const exchangeRate = data.exchangeRate || 1
        const amountInInvoiceCurrency = data.amount * exchangeRate

        // 创建收款记录
        const payment = await prisma.payment.create({
            data: {
                invoiceId: data.invoiceId,
                amount: new Decimal(data.amount),
                currency: data.currency || invoice.currency,
                exchangeRate: new Decimal(exchangeRate),
                amountInInvoiceCurrency: new Decimal(amountInInvoiceCurrency),
                paymentMethod: data.paymentMethod,
                paymentDate: new Date(data.paymentDate),
                reference: data.reference,
                notes: data.notes,
                attachmentUrl: data.attachmentUrl,
                recordedById: recorderId
            }
        })

        // 更新发票已付金额和状态
        const newPaidAmount = Number(invoice.paidAmount) + amountInInvoiceCurrency
        const totalAmount = Number(invoice.totalAmount)

        let newStatus = invoice.status
        if (newPaidAmount >= totalAmount) {
            newStatus = 'PAID'
        } else if (newPaidAmount > 0) {
            newStatus = 'PARTIAL'
        }

        await prisma.invoice.update({
            where: { id: data.invoiceId },
            data: {
                paidAmount: new Decimal(newPaidAmount),
                status: newStatus
            }
        })

        return payment
    },

    /**
     * 获取收款记录列表
     */
    async getPayments(filters: { invoiceId?: string }, pagination: { page: number; limit: number }) {
        const { page, limit } = pagination
        const skip = (page - 1) * limit

        const where: any = {}
        if (filters.invoiceId) where.invoiceId = filters.invoiceId

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { paymentDate: 'desc' },
                include: {
                    invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, currency: true } },
                    recordedBy: { select: { id: true, name: true } }
                }
            }),
            prisma.payment.count({ where })
        ])

        return {
            data: payments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    },

    /**
     * 删除收款记录
     */
    async deletePayment(id: string) {
        const payment = await prisma.payment.findUnique({
            where: { id },
            include: { invoice: true }
        })

        if (!payment) {
            throw new Error('收款记录不存在')
        }

        // 更新发票已付金额
        const newPaidAmount = Number(payment.invoice.paidAmount) - Number(payment.amountInInvoiceCurrency)

        let newStatus = payment.invoice.status
        if (newPaidAmount <= 0) {
            newStatus = 'SENT'
        } else if (newPaidAmount < Number(payment.invoice.totalAmount)) {
            newStatus = 'PARTIAL'
        }

        await prisma.$transaction([
            prisma.payment.delete({ where: { id } }),
            prisma.invoice.update({
                where: { id: payment.invoiceId },
                data: {
                    paidAmount: new Decimal(Math.max(0, newPaidAmount)),
                    status: newStatus
                }
            })
        ])

        return { success: true }
    },

    // ==================== 统计 ====================

    /**
     * 获取发票统计
     */
    async getInvoiceStats(customerId?: string) {
        const where: any = customerId ? { customerId } : {}

        const [
            totalInvoices,
            byStatus,
            totalAmount,
            paidAmount
        ] = await Promise.all([
            prisma.invoice.count({ where }),
            prisma.invoice.groupBy({
                by: ['status'],
                where,
                _count: true,
                _sum: { totalAmount: true }
            }),
            prisma.invoice.aggregate({
                where,
                _sum: { totalAmount: true }
            }),
            prisma.invoice.aggregate({
                where,
                _sum: { paidAmount: true }
            })
        ])

        const outstanding = Number(totalAmount._sum.totalAmount || 0) - Number(paidAmount._sum.paidAmount || 0)

        return {
            totalInvoices,
            totalAmount: Number(totalAmount._sum.totalAmount || 0),
            paidAmount: Number(paidAmount._sum.paidAmount || 0),
            outstandingAmount: outstanding,
            byStatus: byStatus.reduce((acc, item) => {
                acc[item.status] = {
                    count: item._count,
                    amount: Number(item._sum.totalAmount || 0)
                }
                return acc
            }, {} as Record<string, { count: number; amount: number }>)
        }
    },

    /**
     * 检查逾期发票
     */
    async checkOverdueInvoices() {
        const now = new Date()

        // 查找逾期但未标记的发票
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                status: { in: ['SENT', 'PARTIAL'] },
                dueDate: { lt: now }
            }
        })

        // 更新状态为逾期
        if (overdueInvoices.length > 0) {
            await prisma.invoice.updateMany({
                where: {
                    id: { in: overdueInvoices.map(i => i.id) }
                },
                data: { status: 'OVERDUE' }
            })
        }

        return { updated: overdueInvoices.length }
    }
}

export default invoiceService
