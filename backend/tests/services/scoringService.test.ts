import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
    lead: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
    },
    user: {
        findMany: vi.fn(),
    },
    task: {
        count: vi.fn(),
        findMany: vi.fn(),
    },
    appointment: {
        findMany: vi.fn(),
    },
    customer: {
        findMany: vi.fn(),
    },
}))

vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

vi.mock('../../src/config/logger.js', () => ({
    default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { scoringService } from '../../src/services/scoringService.js'

describe('ScoringService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getRules', () => {
        it('应返回活跃的评分规则', async () => {
            const mockRules = [{ id: '1', name: 'Rule 1', isActive: true }]
            prismaMock.lead.findMany.mockResolvedValue([]) // 占位

            // 直接调用 scoringService.getRules
            // 需要也 mock scoringRule
        })
    })

    describe('evaluateRule', () => {
        const mockLead = {
            contactName: 'John',
            email: 'john@test.com',
            phone: '123456',
            companyName: 'ACME',
            country: 'SG',
            serviceTypes: ['company_registration', 'family_office'],
            budgetRange: '100万以上',
            sourceChannel: 'website_form',
            status: 'NEW',
            score: 0,
            tags: ['vip'],
            lastContactedAt: new Date(),
            id: '1',
            createdAt: new Date(),
            updatedAt: new Date(),
            assignedToId: null,
            inquiryMessage: null,
            scoreBreakdown: null,
            scoreUpdatedAt: null,
        } as any

        it('exists 运算符 - 字段存在时返回 true', () => {
            const result = scoringService.evaluateRule(mockLead, {
                field: 'email',
                operator: 'exists',
                score: 10,
            } as any)
            expect(result).toBe(true)
        })

        it('exists 运算符 - 字段为空时返回 false', () => {
            const result = scoringService.evaluateRule(
                { ...mockLead, email: null },
                { field: 'email', operator: 'exists', score: 10 } as any
            )
            expect(result).toBe(false)
        })

        it('not_exists 运算符 - 字段不存在时返回 true', () => {
            const result = scoringService.evaluateRule(
                { ...mockLead, email: null },
                { field: 'email', operator: 'not_exists', score: 5 } as any
            )
            expect(result).toBe(true)
        })

        it('eq 运算符 - 等于时返回 true', () => {
            const result = scoringService.evaluateRule(mockLead, {
                field: 'sourceChannel',
                operator: 'eq',
                value: '"website_form"',
                score: 10,
            } as any)
            expect(result).toBe(true)
        })

        it('neq 运算符 - 不等于时返回 true', () => {
            const result = scoringService.evaluateRule(mockLead, {
                field: 'sourceChannel',
                operator: 'neq',
                value: '"referral"',
                score: 5,
            } as any)
            expect(result).toBe(true)
        })

        it('gt 运算符 - 大于时返回 true', () => {
            const result = scoringService.evaluateRule(
                { ...mockLead, score: 50 },
                { field: 'score', operator: 'gt', value: '30', score: 5 } as any
            )
            expect(result).toBe(true)
        })

        it('gte 运算符', () => {
            expect(scoringService.evaluateRule(
                { ...mockLead, score: 30 },
                { field: 'score', operator: 'gte', value: '30', score: 5 } as any
            )).toBe(true)
        })

        it('lt 运算符', () => {
            expect(scoringService.evaluateRule(
                { ...mockLead, score: 20 },
                { field: 'score', operator: 'lt', value: '30', score: 5 } as any
            )).toBe(true)
        })

        it('lte 运算符', () => {
            expect(scoringService.evaluateRule(
                { ...mockLead, score: 30 },
                { field: 'score', operator: 'lte', value: '30', score: 5 } as any
            )).toBe(true)
        })

        it('contains 运算符 - 字符串', () => {
            expect(scoringService.evaluateRule(mockLead, {
                field: 'email',
                operator: 'contains',
                value: '"john"',
                score: 5,
            } as any)).toBe(true)
        })

        it('contains 运算符 - 数组', () => {
            expect(scoringService.evaluateRule(mockLead, {
                field: 'serviceTypes',
                operator: 'contains',
                value: '"company"',
                score: 5,
            } as any)).toBe(true)
        })

        it('in 运算符', () => {
            expect(scoringService.evaluateRule(mockLead, {
                field: 'budgetRange',
                operator: 'in',
                value: '["100万以上","500万以上"]',
                score: 20,
            } as any)).toBe(true)
        })

        it('in 运算符 - 非 array value 返回 false', () => {
            expect(scoringService.evaluateRule(mockLead, {
                field: 'budgetRange',
                operator: 'in',
                value: '"100万以上"',
                score: 20,
            } as any)).toBe(false)
        })

        it('array_includes 运算符', () => {
            expect(scoringService.evaluateRule(mockLead, {
                field: 'serviceTypes',
                operator: 'array_includes',
                value: '"family_office"',
                score: 20,
            } as any)).toBe(true)
        })

        it('array_includes - 非数组字段返回 false', () => {
            expect(scoringService.evaluateRule(mockLead, {
                field: 'email',
                operator: 'array_includes',
                value: '"test"',
                score: 5,
            } as any)).toBe(false)
        })

        it('array_length_gt 运算符', () => {
            expect(scoringService.evaluateRule(mockLead, {
                field: 'serviceTypes',
                operator: 'array_length_gt',
                value: '1',
                score: 10,
            } as any)).toBe(true)
        })

        it('array_length_gt - 非数组返回 false', () => {
            expect(scoringService.evaluateRule(mockLead, {
                field: 'email',
                operator: 'array_length_gt',
                value: '1',
                score: 10,
            } as any)).toBe(false)
        })

        it('未知运算符返回 false', () => {
            expect(scoringService.evaluateRule(mockLead, {
                field: 'email',
                operator: 'unknown',
                score: 5,
            } as any)).toBe(false)
        })
    })

    describe('getFieldValue', () => {
        it('应获取嵌套字段值', () => {
            const obj = { a: { b: { c: 'value' } } }
            const result = scoringService.getFieldValue(obj as any, 'a.b.c')
            expect(result).toBe('value')
        })

        it('路径中间为 null 时返回 null', () => {
            const obj = { a: null }
            const result = scoringService.getFieldValue(obj as any, 'a.b.c')
            expect(result).toBeNull()
        })
    })

    describe('parseValue', () => {
        it('应解析 JSON 字符串', () => {
            expect(scoringService.parseValue('"hello"')).toBe('hello')
        })

        it('应解析 JSON 数组', () => {
            expect(scoringService.parseValue('[1,2,3]')).toEqual([1, 2, 3])
        })

        it('无效 JSON 时返回原始字符串', () => {
            expect(scoringService.parseValue('not-json')).toBe('not-json')
        })
    })
})
