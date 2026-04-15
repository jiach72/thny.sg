import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    customer: {
        findFirst: vi.fn(),
    },
    invoice: {
        findFirst: vi.fn(),
        update: vi.fn(),
    },
    payment: {
        create: vi.fn(),
        findMany: vi.fn(),
    },
    paymentGatewayTransaction: {
        create: vi.fn(),
        updateMany: vi.fn(),
    },
}))

const mockConfig = vi.hoisted(() => ({
    stripeSecretKey: 'sk_test_123',
    stripeWebhookSecret: 'whsec_test_123',
    portalUrl: 'http://localhost:3002',
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

vi.mock('../../src/config/env.js', () => ({
    config: mockConfig,
}))

// Mock Stripe 模块 — 必须在 paymentService 导入之前
vi.mock('stripe', () => {
    const mockSessionsCreate = vi.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
    })
    const mockConstructEvent = vi.fn().mockReturnValue({
        type: 'checkout.session.completed',
        data: {
            object: {
                id: 'cs_test_123',
                metadata: { invoiceId: 'inv-1' },
                amount_total: 50000,
                currency: 'sgd',
                payment_intent: 'pi_test_123',
            },
        },
    })
    const StripeMock = vi.fn().mockImplementation(() => ({
        checkout: {
            sessions: {
                create: mockSessionsCreate,
            },
        },
        webhooks: {
            constructEvent: mockConstructEvent,
        },
    }))
    return { default: StripeMock }
})

import { paymentService } from '../../src/services/paymentService'

describe('PaymentService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createCheckoutSession', () => {
        it('should create checkout session for valid invoice', async () => {
            prismaMock.customer.findFirst.mockResolvedValue({ id: 'cust-1', userId: 'user-1' })
            prismaMock.invoice.findFirst.mockResolvedValue({
                id: 'inv-1',
                invoiceNumber: 'INV-001',
                totalAmount: 500,
                currency: 'SGD',
                status: 'PENDING',
                project: { title: '测试项目' },
            })
            prismaMock.paymentGatewayTransaction.create.mockResolvedValue({ id: 'txn-1' })

            const result = await paymentService.createCheckoutSession('inv-1', 'user-1')

            expect(result).toHaveProperty('url')
            expect(result).toHaveProperty('sessionId')
        })

        it('should throw error if customer not found', async () => {
            prismaMock.customer.findFirst.mockResolvedValue(null)

            await expect(
                paymentService.createCheckoutSession('inv-1', 'user-no-customer')
            ).rejects.toThrow('客户不存在')
        })

        it('should throw error if invoice already paid', async () => {
            prismaMock.customer.findFirst.mockResolvedValue({ id: 'cust-1', userId: 'user-1' })
            prismaMock.invoice.findFirst.mockResolvedValue({
                id: 'inv-1',
                status: 'PAID',
                project: {},
            })

            await expect(
                paymentService.createCheckoutSession('inv-1', 'user-1')
            ).rejects.toThrow('发票已支付')
        })
    })

    describe('handleWebhook', () => {
        it('should process checkout.session.completed event', async () => {
            prismaMock.payment.create.mockResolvedValue({ id: 'pay-1' })
            prismaMock.paymentGatewayTransaction.updateMany.mockResolvedValue({ count: 1 })
            prismaMock.invoice.update.mockResolvedValue({ id: 'inv-1', status: 'PAID' })

            const result = await paymentService.handleWebhook(
                'sig_test',
                Buffer.from('{"type":"checkout.session.completed"}')
            )

            expect(result.received).toBe(true)
        })
    })

    describe('getPaymentHistory', () => {
        it('should return empty array if customer not found', async () => {
            prismaMock.customer.findFirst.mockResolvedValue(null)

            const result = await paymentService.getPaymentHistory('user-no-customer')

            expect(result).toEqual([])
        })

        it('should return payment history for customer', async () => {
            prismaMock.customer.findFirst.mockResolvedValue({ id: 'cust-1' })
            prismaMock.payment.findMany.mockResolvedValue([
                { id: 'pay-1', amount: 500, currency: 'SGD' },
            ])

            const result = await paymentService.getPaymentHistory('user-1')

            expect(result).toHaveLength(1)
        })
    })
})
