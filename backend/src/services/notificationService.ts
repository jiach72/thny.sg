import { messageService } from './messageService.js'
import { emailSenderService } from './emailSenderService.js'
import { emailTemplateService } from './emailTemplateService.js'
import { notifyUsers } from './websocketService.js'
import { prisma } from '../config/index.js'
import logger from '../config/logger.js'

// ==================== 事件类型定义 ====================

/**
 * 通知事件类型
 */
export type NotificationEvent =
    | 'LEAD_ASSIGNED'
    | 'LEAD_CONVERTED'
    | 'TASK_ASSIGNED'
    | 'TASK_DUE_SOON'
    | 'TASK_OVERDUE'
    | 'INVOICE_CREATED'
    | 'INVOICE_PAID'
    | 'PROJECT_STATUS_CHANGED'
    | 'MESSAGE_RECEIVED'
    | 'SYSTEM_ALERT'
    | 'CLAIM_SUBMITTED'
    | 'CLAIM_APPROVED'
    | 'CLAIM_REJECTED'
    | 'CLAIM_PAID'
    | 'MEETING_REMINDER'

/**
 * 通知渠道
 */
export type NotificationChannel = 'WEBSOCKET' | 'IN_APP' | 'EMAIL'

/**
 * 通知有效负载
 */
interface NotificationPayload {
    /** 事件类型 */
    event: NotificationEvent
    /** 接收者用户 ID 列表 */
    recipientIds: string[]
    /** 触发者用户 ID */
    actorId?: string
    /** 通知标题 */
    title: string
    /** 通知内容 */
    content: string
    /** 关联实体 */
    entity?: {
        type: string   // 'LEAD' | 'TASK' | 'PROJECT' | 'INVOICE'
        id: string
        name?: string
    }
    /** 要使用的渠道（默认全部） */
    channels?: NotificationChannel[]
    /** 邮件模板 ID（仅 EMAIL 渠道使用） */
    emailTemplateId?: string
    /** 邮件模板上下文变量 */
    emailContext?: Record<string, string>
}

// ==================== 事件到通知的默认映射 ====================

const EVENT_CHANNEL_MAP: Record<NotificationEvent, NotificationChannel[]> = {
    LEAD_ASSIGNED: ['WEBSOCKET', 'IN_APP'],
    LEAD_CONVERTED: ['WEBSOCKET', 'IN_APP'],
    TASK_ASSIGNED: ['WEBSOCKET', 'IN_APP'],
    TASK_DUE_SOON: ['WEBSOCKET', 'IN_APP', 'EMAIL'],
    TASK_OVERDUE: ['WEBSOCKET', 'IN_APP', 'EMAIL'],
    INVOICE_CREATED: ['WEBSOCKET', 'IN_APP'],
    INVOICE_PAID: ['WEBSOCKET', 'IN_APP', 'EMAIL'],
    PROJECT_STATUS_CHANGED: ['WEBSOCKET', 'IN_APP'],
    MESSAGE_RECEIVED: ['WEBSOCKET'],
    SYSTEM_ALERT: ['WEBSOCKET', 'IN_APP', 'EMAIL'],
    CLAIM_SUBMITTED: ['WEBSOCKET', 'IN_APP'],
    CLAIM_APPROVED: ['WEBSOCKET', 'IN_APP', 'EMAIL'],
    CLAIM_REJECTED: ['WEBSOCKET', 'IN_APP', 'EMAIL'],
    CLAIM_PAID: ['WEBSOCKET', 'IN_APP', 'EMAIL'],
    MEETING_REMINDER: ['WEBSOCKET', 'IN_APP', 'EMAIL'],
}

// ==================== 通知服务 ====================

export const notificationService = {
    /**
     * 分发通知（统一入口）
     * 根据事件类型自动选择通知渠道并依次发送
     */
    async dispatch(payload: NotificationPayload): Promise<void> {
        const channels = payload.channels || EVENT_CHANNEL_MAP[payload.event] || ['WEBSOCKET', 'IN_APP']

        logger.info('分发通知', {
            event: payload.event,
            recipients: payload.recipientIds.length,
            channels,
            context: 'notificationService',
        })

        // 并发执行各渠道通知（互不阻塞）
        const tasks: Promise<void>[] = []

        if (channels.includes('WEBSOCKET')) {
            tasks.push(this.sendWebSocket(payload))
        }
        if (channels.includes('IN_APP')) {
            tasks.push(this.sendInApp(payload))
        }
        if (channels.includes('EMAIL')) {
            tasks.push(this.sendEmail(payload))
        }

        // 等待所有渠道完成（任一失败不阻塞其他）
        const results = await Promise.allSettled(tasks)
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                logger.error(`通知渠道 ${channels[index]} 发送失败`, {
                    error: result.reason?.message || '未知错误',
                    event: payload.event,
                    context: 'notificationService',
                })
            }
        })
    },

    // ==================== WebSocket 实时推送 ====================

    async sendWebSocket(payload: NotificationPayload): Promise<void> {
        const wsPayload = {
            event: payload.event,
            title: payload.title,
            content: payload.content,
            entity: payload.entity,
            timestamp: new Date().toISOString(),
        }

        notifyUsers(payload.recipientIds, 'notification', wsPayload)
    },

    // ==================== 站内消息（持久化） ====================

    async sendInApp(payload: NotificationPayload): Promise<void> {
        // 需要有 actorId 才能创建站内消息（系统消息使用系统用户）
        const senderId = payload.actorId || await this.getSystemUserId()

        if (!senderId) {
            logger.warn('无法发送站内消息：缺少发送者 ID', { context: 'notificationService' })
            return
        }

        // 映射事件类型到消息类型
        const messageType = this.mapEventToMessageType(payload.event)

        for (const recipientId of payload.recipientIds) {
            try {
                await messageService.send({
                    senderId,
                    recipientId,
                    title: payload.title,
                    content: payload.content,
                    type: messageType,
                })
            } catch (error) {
                logger.error('站内消息发送失败', {
                    recipientId,
                    error: error instanceof Error ? error.message : '未知错误',
                    context: 'notificationService',
                })
            }
        }
    },

    // ==================== 邮件通知 ====================

    async sendEmail(payload: NotificationPayload): Promise<void> {
        // 获取接收者的邮箱地址
        const users = await prisma.user.findMany({
            where: { id: { in: payload.recipientIds } },
            select: { id: true, email: true, name: true },
        })

        for (const user of users) {
            try {
                if (payload.emailTemplateId) {
                    // 使用邮件模板
                    await emailTemplateService.sendWithTemplate(
                        payload.emailTemplateId,
                        user.email,
                        { custom: payload.emailContext || {} },
                        { leadId: payload.entity?.type === 'LEAD' ? payload.entity.id : undefined },
                        payload.actorId,
                    )
                } else {
                    // 直接发送
                    await emailSenderService.send({
                        to: user.email,
                        subject: payload.title,
                        html: `<p>${payload.content}</p>`,
                    })
                }
            } catch (error) {
                logger.error('邮件通知发送失败', {
                    email: user.email,
                    error: error instanceof Error ? error.message : '未知错误',
                    context: 'notificationService',
                })
            }
        }
    },

    // ==================== 便捷方法 ====================

    /**
     * 线索分配通知
     */
    async notifyLeadAssigned(leadId: string, leadName: string, assigneeId: string, assignerId: string): Promise<void> {
        await this.dispatch({
            event: 'LEAD_ASSIGNED',
            recipientIds: [assigneeId],
            actorId: assignerId,
            title: '新线索分配',
            content: `您被分配了新线索「${leadName}」，请及时跟进`,
            entity: { type: 'LEAD', id: leadId, name: leadName },
        })
    },

    /**
     * 任务分配通知
     */
    async notifyTaskAssigned(taskId: string, taskTitle: string, assigneeId: string, assignerId: string): Promise<void> {
        await this.dispatch({
            event: 'TASK_ASSIGNED',
            recipientIds: [assigneeId],
            actorId: assignerId,
            title: '新任务分配',
            content: `您收到了新任务「${taskTitle}」`,
            entity: { type: 'TASK', id: taskId, name: taskTitle },
        })
    },

    /**
     * 发票付款通知
     */
    async notifyInvoicePaid(invoiceId: string, invoiceNumber: string, recipientIds: string[]): Promise<void> {
        await this.dispatch({
            event: 'INVOICE_PAID',
            recipientIds,
            title: '发票已付款',
            content: `发票 ${invoiceNumber} 已收到付款`,
            entity: { type: 'INVOICE', id: invoiceId, name: invoiceNumber },
        })
    },

    /**
     * 任务即将到期通知
     */
    async notifyTaskDueSoon(taskId: string, taskTitle: string, assigneeId: string, dueDate: string): Promise<void> {
        await this.dispatch({
            event: 'TASK_DUE_SOON',
            recipientIds: [assigneeId],
            title: '任务即将到期',
            content: `任务「${taskTitle}」将于 ${dueDate} 到期`,
            entity: { type: 'TASK', id: taskId, name: taskTitle },
        })
    },

    // ==================== 内部工具方法 ====================

    /**
     * 获取系统用户 ID（用于系统通知的发送者）
     */
    async getSystemUserId(): Promise<string | null> {
        const systemUser = await prisma.user.findFirst({
            where: { role: { code: 'ADMIN' } },
            select: { id: true },
        })
        return systemUser?.id || null
    },

    /**
     * 将事件类型映射到消息类型
     */
    mapEventToMessageType(event: NotificationEvent): 'SYSTEM' | 'PROJECT' | 'DOCUMENT' | 'PAYMENT' | 'REMINDER' | 'ANNOUNCEMENT' {
        const mapping: Record<NotificationEvent, 'SYSTEM' | 'PROJECT' | 'DOCUMENT' | 'PAYMENT' | 'REMINDER' | 'ANNOUNCEMENT'> = {
            LEAD_ASSIGNED: 'SYSTEM',
            LEAD_CONVERTED: 'SYSTEM',
            TASK_ASSIGNED: 'REMINDER',
            TASK_DUE_SOON: 'REMINDER',
            TASK_OVERDUE: 'REMINDER',
            INVOICE_CREATED: 'PAYMENT',
            INVOICE_PAID: 'PAYMENT',
            PROJECT_STATUS_CHANGED: 'PROJECT',
            MESSAGE_RECEIVED: 'SYSTEM',
            SYSTEM_ALERT: 'ANNOUNCEMENT',
            CLAIM_SUBMITTED: 'PAYMENT',
            CLAIM_APPROVED: 'PAYMENT',
            CLAIM_REJECTED: 'PAYMENT',
            CLAIM_PAID: 'PAYMENT',
            MEETING_REMINDER: 'REMINDER',
        }
        return mapping[event] || 'SYSTEM'
    },

    // ==================== 报销通知便捷方法 ====================

    /**
     * 报销单提交通知（通知审批人）
     */
    async notifyClaimSubmitted(claimId: string, claimNumber: string, submitterName: string, approverIds: string[]): Promise<void> {
        await this.dispatch({
            event: 'CLAIM_SUBMITTED',
            recipientIds: approverIds,
            title: '新报销单待审批',
            content: `${submitterName} 提交了报销单 ${claimNumber}，请及时审批`,
            entity: { type: 'CLAIM', id: claimId, name: claimNumber },
        })
    },

    /**
     * 报销单审批通过通知
     */
    async notifyClaimApproved(claimId: string, claimNumber: string, submitterId: string, approverId: string): Promise<void> {
        await this.dispatch({
            event: 'CLAIM_APPROVED',
            recipientIds: [submitterId],
            actorId: approverId,
            title: '报销单已批准',
            content: `您的报销单 ${claimNumber} 已获批准`,
            entity: { type: 'CLAIM', id: claimId, name: claimNumber },
        })
    },

    /**
     * 报销单驳回通知
     */
    async notifyClaimRejected(claimId: string, claimNumber: string, submitterId: string, rejectorId: string, reason: string): Promise<void> {
        await this.dispatch({
            event: 'CLAIM_REJECTED',
            recipientIds: [submitterId],
            actorId: rejectorId,
            title: '报销单被驳回',
            content: `您的报销单 ${claimNumber} 被驳回，原因：${reason}`,
            entity: { type: 'CLAIM', id: claimId, name: claimNumber },
        })
    },

    /**
     * 会议提醒通知
     */
    async notifyMeetingReminder(meetingId: string, title: string, startTime: string, participantIds: string[]): Promise<void> {
        await this.dispatch({
            event: 'MEETING_REMINDER',
            recipientIds: participantIds,
            title: '会议提醒',
            content: `会议「${title}」将于 ${startTime} 开始，请准时参加`,
            entity: { type: 'APPOINTMENT', id: meetingId, name: title },
        })
    },
}

export default notificationService
