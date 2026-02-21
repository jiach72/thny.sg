import ExcelJS from 'exceljs'
import { prisma } from '../config/index.js'
import logger from '../config/logger.js'

/**
 * 通用列定义
 */
interface ColumnDef {
    header: string
    key: string
    width: number
}

/**
 * 导出选项
 */
interface ExportOptions {
    /** 工作表名称 */
    sheetName?: string
    /** 日期范围筛选 */
    startDate?: string
    endDate?: string
}

export const exportService = {
    // ==================== 线索导出 ====================

    /**
     * 导出线索列表为 Excel Buffer
     */
    async exportLeads(options: ExportOptions = {}): Promise<Buffer> {
        const where: Record<string, unknown> = { deletedAt: null }

        if (options.startDate || options.endDate) {
            const createdAt: Record<string, Date> = {}
            if (options.startDate) createdAt.gte = new Date(options.startDate)
            if (options.endDate) createdAt.lte = new Date(options.endDate)
            where.createdAt = createdAt
        }

        const leads = await prisma.lead.findMany({
            where,
            include: {
                assignedTo: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        const columns: ColumnDef[] = [
            { header: '联系人', key: 'contactName', width: 18 },
            { header: '公司', key: 'companyName', width: 22 },
            { header: '邮箱', key: 'email', width: 25 },
            { header: '电话', key: 'phone', width: 16 },
            { header: '国家', key: 'country', width: 12 },
            { header: '状态', key: 'status', width: 12 },
            { header: '评分', key: 'score', width: 8 },
            { header: '来源渠道', key: 'sourceChannel', width: 14 },
            { header: '分配人', key: 'assignedTo', width: 14 },
            { header: '标签', key: 'tags', width: 20 },
            { header: '创建时间', key: 'createdAt', width: 18 },
        ]

        const rows = leads.map((lead) => ({
            contactName: lead.contactName,
            companyName: lead.companyName || '',
            email: lead.email || '',
            phone: lead.phone || '',
            country: lead.country || '',
            status: lead.status,
            score: lead.score,
            sourceChannel: lead.sourceChannel,
            assignedTo: lead.assignedTo?.name || '未分配',
            tags: lead.tags.join(', '),
            createdAt: lead.createdAt.toISOString().split('T')[0],
        }))

        logger.info('导出线索', { count: rows.length, context: 'exportService' })
        return this.buildWorkbook(columns, rows, options.sheetName || '线索列表')
    },

    // ==================== 发票导出 ====================

    /**
     * 导出发票列表为 Excel Buffer
     */
    async exportInvoices(options: ExportOptions = {}): Promise<Buffer> {
        const where: Record<string, unknown> = { deletedAt: null }

        if (options.startDate || options.endDate) {
            const createdAt: Record<string, Date> = {}
            if (options.startDate) createdAt.gte = new Date(options.startDate)
            if (options.endDate) createdAt.lte = new Date(options.endDate)
            where.createdAt = createdAt
        }

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                project: {
                    include: {
                        customer: {
                            include: { lead: { select: { contactName: true, companyName: true } } }
                        }
                    }
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        const columns: ColumnDef[] = [
            { header: '发票号', key: 'invoiceNumber', width: 18 },
            { header: '客户', key: 'customer', width: 22 },
            { header: '项目', key: 'project', width: 20 },
            { header: '金额', key: 'totalAmount', width: 14 },
            { header: '币种', key: 'currency', width: 8 },
            { header: '状态', key: 'status', width: 12 },
            { header: '开票日', key: 'issueDate', width: 14 },
            { header: '到期日', key: 'dueDate', width: 14 },
        ]

        const rows = invoices.map((inv) => ({
            invoiceNumber: inv.invoiceNumber,
            customer: inv.project?.customer?.lead?.companyName || inv.project?.customer?.lead?.contactName || '',
            project: inv.project?.title || '',
            totalAmount: Number(inv.totalAmount),
            currency: inv.currency,
            status: inv.status,
            issueDate: inv.issueDate.toISOString().split('T')[0],
            dueDate: inv.dueDate.toISOString().split('T')[0],
        }))

        logger.info('导出发票', { count: rows.length, context: 'exportService' })
        return this.buildWorkbook(columns, rows, options.sheetName || '发票列表')
    },

    // ==================== 审计日志导出 ====================

    /**
     * 导出审计日志为 Excel Buffer
     */
    async exportAuditLogs(options: ExportOptions = {}): Promise<Buffer> {
        const where: Record<string, unknown> = {}

        if (options.startDate || options.endDate) {
            const createdAt: Record<string, Date> = {}
            if (options.startDate) createdAt.gte = new Date(options.startDate)
            if (options.endDate) createdAt.lte = new Date(options.endDate)
            where.createdAt = createdAt
        }

        const logs = await prisma.auditLog.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10000, // 限制最大导出量
        })

        const columns: ColumnDef[] = [
            { header: '操作人', key: 'userName', width: 14 },
            { header: '邮箱', key: 'userEmail', width: 22 },
            { header: '动作', key: 'action', width: 14 },
            { header: '资源类型', key: 'resource', width: 14 },
            { header: '资源 ID', key: 'resourceId', width: 24 },
            { header: 'IP 地址', key: 'ipAddress', width: 16 },
            { header: '时间', key: 'createdAt', width: 20 },
        ]

        const rows = logs.map((log) => ({
            userName: log.user?.name || '',
            userEmail: log.user?.email || '',
            action: log.action,
            resource: log.resource,
            resourceId: log.resourceId || '',
            ipAddress: log.ipAddress || '',
            createdAt: log.createdAt.toISOString().replace('T', ' ').slice(0, 19),
        }))

        logger.info('导出审计日志', { count: rows.length, context: 'exportService' })
        return this.buildWorkbook(columns, rows, options.sheetName || '审计日志')
    },

    // ==================== 客户终端数据导出 ====================

    /**
     * 导出客户个人安全资料与账单记录 (Excel)
     */
    async exportCustomerData(userId: string): Promise<Buffer> {
        // 获取客户的发票记录
        const invoices = await prisma.invoice.findMany({
            where: { project: { customerId: userId }, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: { project: { select: { title: true } } }
        })

        // 获取客户的安全活动记录 (Audit Logs)
        const logs = await prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5000
        })

        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'TongHai CRM'
        workbook.created = new Date()

        // --- Sheet 1: 账单记录 ---
        const invoiceSheet = workbook.addWorksheet('账单记录')
        const invoiceColumns: ColumnDef[] = [
            { header: '发票号', key: 'invoiceNumber', width: 18 },
            { header: '项目', key: 'project', width: 25 },
            { header: '金额', key: 'totalAmount', width: 14 },
            { header: '币种', key: 'currency', width: 8 },
            { header: '状态', key: 'status', width: 12 },
            { header: '开票日', key: 'issueDate', width: 14 },
            { header: '到期日', key: 'dueDate', width: 14 },
        ]
        invoiceSheet.columns = invoiceColumns

        const invHeaderRow = invoiceSheet.getRow(1)
        invHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        invHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
        invHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
        invHeaderRow.height = 28

        invoices.forEach(inv => {
            invoiceSheet.addRow({
                invoiceNumber: inv.invoiceNumber,
                project: inv.project?.title || '-',
                totalAmount: Number(inv.totalAmount),
                currency: inv.currency,
                status: inv.status,
                issueDate: inv.issueDate.toISOString().split('T')[0],
                dueDate: inv.dueDate.toISOString().split('T')[0],
            })
        })
        for (let i = 2; i <= invoices.length + 1; i++) {
            const row = invoiceSheet.getRow(i)
            row.alignment = { vertical: 'middle' }
            if (i % 2 === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
        }

        // --- Sheet 2: 安全与活动日志 ---
        const logSheet = workbook.addWorksheet('安全与活动日志')
        const logColumns: ColumnDef[] = [
            { header: '动作', key: 'action', width: 16 },
            { header: '资源', key: 'resource', width: 16 },
            { header: 'IP 地址', key: 'ipAddress', width: 16 },
            { header: '时间', key: 'createdAt', width: 22 },
        ]
        logSheet.columns = logColumns

        const logHeaderRow = logSheet.getRow(1)
        logHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        logHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
        logHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' }
        logHeaderRow.height = 28

        logs.forEach(log => {
            logSheet.addRow({
                action: log.action,
                resource: log.resource,
                ipAddress: log.ipAddress || '',
                createdAt: log.createdAt.toISOString().replace('T', ' ').slice(0, 19),
            })
        })
        for (let i = 2; i <= logs.length + 1; i++) {
            const row = logSheet.getRow(i)
            row.alignment = { vertical: 'middle' }
            if (i % 2 === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
        }

        logger.info('导出客户个人资料与账单记录', { userId, context: 'exportService' })
        const buffer = await workbook.xlsx.writeBuffer()
        return Buffer.from(buffer)
    },

    // ==================== 通用 Excel 构建器 ====================

    /**
     * 构建 Excel 工作簿并返回 Buffer
     */
    async buildWorkbook(columns: ColumnDef[], rows: Record<string, unknown>[], sheetName: string): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'TongHai CRM'
        workbook.created = new Date()

        const sheet = workbook.addWorksheet(sheetName)
        sheet.columns = columns

        // 设置表头样式
        const headerRow = sheet.getRow(1)
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2563EB' },
        }
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
        headerRow.height = 28

        // 添加数据行
        rows.forEach((row) => {
            sheet.addRow(row)
        })

        // 设置数据行样式
        for (let i = 2; i <= rows.length + 1; i++) {
            const row = sheet.getRow(i)
            row.alignment = { vertical: 'middle' }
            // 斑马纹
            if (i % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF8FAFC' },
                }
            }
        }

        const buffer = await workbook.xlsx.writeBuffer()
        return Buffer.from(buffer)
    },
}

export default exportService
