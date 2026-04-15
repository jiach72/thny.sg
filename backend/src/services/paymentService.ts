import Stripe from 'stripe'
import { prisma } from '../config/index.js'
import { config } from '../config/env.js'
import { NotFoundError, BusinessLogicError } from '../middlewares/index.js'
import logger from '../config/logger.js'

let stripe: InstanceType<typeof Stripe> | null = null
if (config.stripeSecretKey) {
    stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2026-03-25.dahlia',
    })
} else {
    logger.warn('STRIPE_SECRET_KEY 未配置，支付功能不可用')
}

export const paymentService = {
    async createCheckoutSession(invoiceId: string, userId: string) {
        if (!stripe) {
            throw new BusinessLogicError('支付服务未配置，请联系管理员')
        }
        const customer = await prisma.customer.findFirst({
            where: { userId },
        })

        if (!customer) {
            throw new NotFoundError('客户不存在')
        }

        const invoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                customerId: customer.id,
            },
            include: { project: true },
        })

        if (!invoice) {
            throw new NotFoundError('发票不存在')
        }

        if (invoice.status === 'PAID') {
            throw new BusinessLogicError('发票已支付')
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: invoice.currency.toLowerCase(),
                        product_data: {
                            name: `Invoice #${invoice.invoiceNumber}`,
                        },
                        unit_amount: Math.round(Number(invoice.totalAmount) * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${config.portalUrl}/invoices?payment=success`,
            cancel_url: `${config.portalUrl}/invoices?payment=cancelled`,
            metadata: { invoiceId: invoice.id },
        })

        await prisma.paymentGatewayTransaction.create({
            data: {
                paymentId: '',
                gatewayType: 'STRIPE',
                gatewayTransId: session.id,
                gatewayStatus: 'PENDING',
                paymentUrl: session.url,
                amount: invoice.totalAmount,
                currency: invoice.currency,
                metadata: { invoiceId: invoice.id, sessionId: session.id },
            },
        })

        return { url: session.url, sessionId: session.id }
    },

    async handleWebhook(signature: string, payload: Buffer) {
        if (!stripe) {
            throw new BusinessLogicError('支付服务未配置')
        }
        const event = stripe.webhooks.constructEvent(
            payload,
            signature,
            config.stripeWebhookSecret || ''
        )

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Record<string, any>
            const invoiceId = session.metadata?.invoiceId

            if (invoiceId) {
                const amount = session.amount_total
                    ? session.amount_total / 100
                    : 0

                const payment = await prisma.payment.create({
                    data: {
                        invoiceId,
                        amount,
                        currency: session.currency?.toUpperCase() || 'SGD',
                        exchangeRate: 1,
                        amountInInvoiceCurrency: amount,
                        paymentMethod: 'CREDIT_CARD',
                        paymentDate: new Date(),
                        reference: session.payment_intent as string,
                    },
                })

                await prisma.paymentGatewayTransaction.updateMany({
                    where: { gatewayTransId: session.id },
                    data: {
                        paymentId: payment.id,
                        gatewayStatus: 'COMPLETED',
                        paidAt: new Date(),
                    },
                })

                await prisma.invoice.update({
                    where: { id: invoiceId },
                    data: { status: 'PAID' },
                })

                logger.info('Stripe 支付成功', {
                    invoiceId,
                    paymentId: payment.id,
                    amount,
                })
            }
        }

        return { received: true }
    },

    async getPaymentHistory(userId: string) {
        const customer = await prisma.customer.findFirst({
            where: { userId },
        })

        if (!customer) return []

        return prisma.payment.findMany({
            where: {
                invoice: { customerId: customer.id },
                deletedAt: null,
            },
            include: {
                invoice: {
                    select: {
                        invoiceNumber: true,
                        title: true,
                        currency: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        })
    },
}

export default paymentService
