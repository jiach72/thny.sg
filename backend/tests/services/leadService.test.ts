import { describe, it, expect, vi, beforeEach } from 'vitest'

// 1. Hoist the mock object creation
const prismaMock = vi.hoisted(() => ({
    lead: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
        delete: vi.fn(),
    },
    user: {
        findUnique: vi.fn(),
    },
    activity: {
        create: vi.fn(),
        findMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prismaMock)),
}))

// 2. Mock the module using the hoisted variable
vi.mock('../../src/config/index.js', () => ({
    prisma: prismaMock,
}))

// 3. Import service AFTER mocking
import { leadService } from '../../src/services/leadService'

describe('LeadService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createLead', () => {
        it('should create lead successfully', async () => {
            prismaMock.lead.findFirst.mockResolvedValue(null) // No existing lead
            prismaMock.lead.findMany.mockResolvedValue([]) // No duplicate check conflict

            const mockLead = {
                id: 'lead-1',
                contactName: 'John Doe',
                status: 'NEW',
            }
            prismaMock.lead.create.mockResolvedValue(mockLead as any)

            const result = await leadService.createLead({
                contactName: 'John Doe',
                sourceChannel: 'website',
                email: 'john@example.com',
            }, 'creator-id')

            expect(result.id).toBe('lead-1')
            expect(prismaMock.lead.create).toHaveBeenCalled()
            expect(prismaMock.activity.create).toHaveBeenCalled()
        })
    })

    describe('assignLead', () => {
        it('should assign lead successfully', async () => {
            const mockLead = {
                id: 'lead-1',
                contactName: 'John Doe',
                assignedToId: null,
            }
            const mockUser = {
                id: 'user-2',
                name: 'Sales Person',
            }

            prismaMock.lead.findUnique.mockResolvedValue(mockLead as any)
            prismaMock.user.findUnique.mockResolvedValue(mockUser as any)
            prismaMock.lead.update.mockResolvedValue({
                ...mockLead,
                assignedToId: 'user-2',
            } as any)

            const result = await leadService.assignLead('lead-1', 'user-2', 'assigner-id', 'Reassign')

            expect(result.assignedToId).toBe('user-2')
            expect(prismaMock.lead.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'lead-1' },
                data: { assignedToId: 'user-2' }
            }))

            // Verify activity log
            expect(prismaMock.activity.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    actionType: 'ASSIGNED',
                    entityId: 'lead-1',
                    changes: expect.objectContaining({
                        newAssignee: 'user-2',
                        reason: 'Reassign'
                    })
                })
            }))
        })

        it('should throw error if lead not found', async () => {
            prismaMock.lead.findUnique.mockResolvedValue(null)

            await expect(leadService.assignLead('lead-999', 'user-2', 'admin'))
                .rejects.toThrow('线索不存在')
        })
    })
})
