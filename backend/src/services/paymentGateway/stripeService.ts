import { prisma } from '../../config/index.js'
import logger from '../../config/logger.js'

/**
 * Stripe 支付服务（脚手架）
 *
 * 需要在 .env 中配置：
 *   STRIPE_SECRET_KEY=sk_test_xxx
 *   STRIPE_WEBHOOK_SECRET=whsec_xxx
 *
 * 需要安装依赖：
 *   npm install stripe
 */
export const stripeService = {
    /**
     * 创建支付意图
     * TODO: 待 Stripe SDK 集成后实现
     */
    async createPaymentIntent(paymentId: string, amount: number, currency: string = 'SGD') {
        logger.warn('Stripe 服务尚未配置，请设置 STRIPE_SECRET_KEY', { context: 'stripe' })

        // 脚手架：记录网关交易
        const transaction = await prisma.paymentGatewayTransaction.create({
            data: {
                paymentId,
                gatewayType: 'STRIPE',
                gatewayTransId: null,
                gatewayStatus: 'PENDING',
                amount,
                currency,
            },
        })

        return {
            transactionId: transaction.id,
            clientSecret: null, // Stripe 集成后返回 PaymentIntent.client_secret
            message: 'Stripe 支付尚未配置，请联系管理员',
        }
    },

    /**
     * 处理 Stripe Webhook 回调
     * TODO: 待 Stripe SDK 集成后实现
     */
    async handleWebhook(_payload: string, _signature: string) {
        logger.warn('Stripe Webhook 处理尚未实现', { context: 'stripe' })

        return { received: true, processed: false }
    },
}
