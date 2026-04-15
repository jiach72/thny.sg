/**
 * Webhook 事件推送服务
 * 允许外部系统（微信企业号、飞书等）订阅 CRM 事件
 * 参照 HubSpot Webhook 规范设计
 */
import { prisma } from '../config/index.js'
import { Prisma } from '@prisma/client'
import crypto from 'crypto'
import { validateSafeUrl } from '../config/ssrfProtection.js'

/** 支持的 Webhook 事件类型 */
export type WebhookEvent =
    | 'lead.created'
    | 'lead.updated'
    | 'lead.converted'
    | 'lead.assigned'
    | 'customer.created'
    | 'customer.updated'
    | 'project.created'
    | 'project.statusChanged'
    | 'invoice.created'
    | 'invoice.paid'
    | 'claim.submitted'
    | 'claim.approved'
    | 'claim.rejected'
    | 'claim.paid'
    | 'vendor.created'
    | 'vendor.updated'
    | 'vendor.deleted'

/** Webhook 推送负载 */
interface WebhookPayload {
    event: WebhookEvent
    timestamp: string
    data: Record<string, unknown>
}

/** 推送结果 */
interface DeliveryResult {
    endpointId: string
    url: string
    status: 'success' | 'failed'
    statusCode?: number
    error?: string
}

function maskSecret(secret: string): string {
    if (secret.length <= 8) return '****'
    return secret.slice(0, 4) + '****' + secret.slice(-4)
}

export const webhookService = {
    /**
     * 注册 Webhook 端点
     */
    async registerEndpoint(data: {
        url: string
        events: WebhookEvent[]
        name?: string
        createdById: string
    }) {
        await validateSafeUrl(data.url)

        const secret = crypto.randomBytes(32).toString('hex')

        return prisma.webhookEndpoint.create({
            data: {
                url: data.url,
                events: data.events,
                secret,
                name: data.name || '未命名端点',
                isActive: true,
                createdById: data.createdById,
            },
        })
    },

    /**
     * 获取所有注册的 Webhook 端点
     */
    async listEndpoints() {
        const endpoints = await prisma.webhookEndpoint.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: { select: { id: true, name: true } },
            },
        })
        return endpoints.map(ep => ({ ...ep, secret: maskSecret(ep.secret) }))
    },

    /**
     * 更新端点
     */
    async updateEndpoint(id: string, data: { url?: string; events?: WebhookEvent[]; isActive?: boolean; name?: string }) {
        return prisma.webhookEndpoint.update({
            where: { id },
            data,
        })
    },

    /**
     * 删除端点
     */
    async deleteEndpoint(id: string) {
        await prisma.webhookEndpoint.delete({ where: { id } })
        return { success: true }
    },

    /**
     * 触发 Webhook 事件 — 查找订阅该事件的所有端点并异步推送
     * 在业务代码中调用此方法（fire-and-forget 模式）
     */
    async emit(event: WebhookEvent, data: Record<string, unknown>): Promise<void> {
        const endpoints = await prisma.webhookEndpoint.findMany({
            where: {
                isActive: true,
                events: { has: event },
            },
        })

        if (endpoints.length === 0) return

        const payload: WebhookPayload = {
            event,
            timestamp: new Date().toISOString(),
            data,
        }

        // 并行推送到所有订阅端点（不阻塞主流程）
        const results = await Promise.allSettled(
            endpoints.map((ep: { id: string; url: string; secret: string }) => this.deliver(ep.id, ep.url, ep.secret, payload))
        )

        // 记录推送结果（异步，不阻塞）
        for (const result of results) {
            if (result.status === 'fulfilled') {
                await this.logDelivery(result.value, payload).catch(() => {
                    // 日志写入失败不影响主流程
                })
            }
        }
    },

    /**
     * 向单个端点推送
     */
    async deliver(
        endpointId: string,
        url: string,
        secret: string,
        payload: WebhookPayload
    ): Promise<DeliveryResult> {
        const body = JSON.stringify(payload)
        const signature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex')

        try {
            await validateSafeUrl(url)

            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 10000) // 10s 超时

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': payload.event,
                    'User-Agent': 'TongHai-CRM-Webhook/1.0',
                },
                body,
                signal: controller.signal,
            })

            clearTimeout(timeout)

            return {
                endpointId,
                url,
                status: response.ok ? 'success' : 'failed',
                statusCode: response.status,
            }
        } catch (err) {
            return {
                endpointId,
                url,
                status: 'failed',
                error: err instanceof Error ? err.message : '未知错误',
            }
        }
    },

    /**
     * 记录推送日志
     */
    async logDelivery(result: DeliveryResult, payload: WebhookPayload): Promise<void> {
        await prisma.webhookLog.create({
            data: {
                endpointId: result.endpointId,
                event: payload.event,
                status: result.status,
                statusCode: result.statusCode,
                error: result.error,
                payload: payload as unknown as Prisma.InputJsonObject,
            },
        })
    },
}

export default webhookService
