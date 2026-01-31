import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1. Hoist the mock object creation
const prismaMock = vi.hoisted(() => ({
    scoringRule: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    lead: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
    },
}))

// 2. Mock the module using the hoisted variable
vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

// 3. Import service AFTER mocking
import { scoringService } from '../../src/services/scoringService'

describe('ScoringService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getRules', () => {
        it('should return active rules by default', async () => {
            const mockRules = [
                { id: 'rule-1', name: '有邮箱', field: 'email', operator: 'exists', score: 10, isActive: true },
                { id: 'rule-2', name: '有电话', field: 'phone', operator: 'exists', score: 10, isActive: true },
            ]

            prismaMock.scoringRule.findMany.mockResolvedValue(mockRules as any)

            const result = await scoringService.getRules()

            expect(result).toHaveLength(2)
            expect(prismaMock.scoringRule.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { isActive: true },
                })
            )
        })
    })

    describe('createRule', () => {
        it('should create a new scoring rule', async () => {
            const input = { name: '高预算', field: 'budgetRange', operator: 'exists', score: 20 }
            const mockCreated = { id: 'rule-new', ...input, isActive: true, sortOrder: 0 }

            prismaMock.scoringRule.create.mockResolvedValue(mockCreated as any)

            const result = await scoringService.createRule(input)

            expect(result.id).toBe('rule-new')
            expect(result.score).toBe(20)
            expect(prismaMock.scoringRule.create).toHaveBeenCalled()
        })
    })

    describe('evaluateRule', () => {
        const mockLead = {
            id: 'lead-1',
            email: 'test@example.com',
            phone: null,
            companyName: 'Test Company',
            serviceTypes: ['company_registration', 'family_office'],
            budgetRange: '100万以上',
            score: 0,
        }

        it('should return true for exists operator when field has value', () => {
            const rule = { field: 'email', operator: 'exists', value: null } as any
            expect(scoringService.evaluateRule(mockLead as any, rule)).toBe(true)
        })

        it('should return false for exists operator when field is null', () => {
            const rule = { field: 'phone', operator: 'exists', value: null } as any
            expect(scoringService.evaluateRule(mockLead as any, rule)).toBe(false)
        })

        it('should handle eq operator correctly', () => {
            const rule = { field: 'budgetRange', operator: 'eq', value: '"100万以上"' } as any
            expect(scoringService.evaluateRule(mockLead as any, rule)).toBe(true)
        })

        it('should handle array_includes operator correctly', () => {
            const rule = { field: 'serviceTypes', operator: 'array_includes', value: '"family_office"' } as any
            expect(scoringService.evaluateRule(mockLead as any, rule)).toBe(true)
        })

        it('should handle array_length_gt operator correctly', () => {
            const rule = { field: 'serviceTypes', operator: 'array_length_gt', value: '1' } as any
            expect(scoringService.evaluateRule(mockLead as any, rule)).toBe(true)
        })
    })

    describe('calculateScore', () => {
        it('should calculate total score based on matching rules', async () => {
            const mockLead = {
                id: 'lead-1',
                email: 'test@example.com',
                phone: '12345678',
                companyName: 'Test Company',
                serviceTypes: ['company_registration'],
                budgetRange: null,
            }

            const mockRules = [
                { id: 'rule-1', name: '有邮箱', field: 'email', operator: 'exists', score: 10, isActive: true },
                { id: 'rule-2', name: '有电话', field: 'phone', operator: 'exists', score: 10, isActive: true },
                { id: 'rule-3', name: '有预算', field: 'budgetRange', operator: 'exists', score: 15, isActive: true },
            ]

            prismaMock.scoringRule.findMany.mockResolvedValue(mockRules as any)

            const result = await scoringService.calculateScore(mockLead as any)

            // 有邮箱 (10) + 有电话 (10) = 20
            expect(result.score).toBe(20)
            expect(result.breakdown['有邮箱']).toBe(10)
            expect(result.breakdown['有电话']).toBe(10)
            expect(result.matchedRules).toContain('rule-1')
            expect(result.matchedRules).toContain('rule-2')
            expect(result.matchedRules).not.toContain('rule-3')
        })
    })

    describe('updateLeadScore', () => {
        it('should update lead with calculated score', async () => {
            const mockLead = {
                id: 'lead-1',
                email: 'test@example.com',
                phone: null,
                companyName: null,
            }

            const mockRules = [
                { id: 'rule-1', name: '有邮箱', field: 'email', operator: 'exists', score: 10, isActive: true },
            ]

            prismaMock.lead.findUnique.mockResolvedValue(mockLead as any)
            prismaMock.scoringRule.findMany.mockResolvedValue(mockRules as any)
            prismaMock.lead.update.mockResolvedValue({
                ...mockLead,
                score: 10,
                scoreBreakdown: { '有邮箱': 10 },
                scoreUpdatedAt: new Date(),
            } as any)

            const result = await scoringService.updateLeadScore('lead-1')

            expect(result.score).toBe(10)
            expect(prismaMock.lead.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'lead-1' },
                    data: expect.objectContaining({
                        score: 10,
                    }),
                })
            )
        })

        it('should throw error if lead not found', async () => {
            prismaMock.lead.findUnique.mockResolvedValue(null)

            await expect(scoringService.updateLeadScore('lead-999'))
                .rejects.toThrow('线索不存在')
        })
    })

    describe('deleteRule', () => {
        it('should delete a scoring rule', async () => {
            prismaMock.scoringRule.delete.mockResolvedValue({ id: 'rule-1' } as any)

            await scoringService.deleteRule('rule-1')

            expect(prismaMock.scoringRule.delete).toHaveBeenCalledWith({
                where: { id: 'rule-1' },
            })
        })
    })
})
