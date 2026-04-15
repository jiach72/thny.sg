import { BaseRepository, PaginationOptions, PaginatedResult } from './BaseRepository.js'
import type { FamilyMember, Prisma } from '@prisma/client'

export interface FamilyMemberFilters {
    customerId?: string
    isBeneficiary?: boolean
    relationship?: string
    search?: string
}

export class FamilyMemberRepository extends BaseRepository<
    FamilyMember,
    Prisma.FamilyMemberCreateInput,
    Prisma.FamilyMemberUpdateInput
> {
    protected modelName = 'familyMember'

    async findByCustomerId(customerId: string): Promise<FamilyMember[]> {
        return this.model.findMany({
            where: {
                customerId,
                deletedAt: null,
            },
            orderBy: { createdAt: 'asc' },
        })
    }

    async findMembers(
        filters: FamilyMemberFilters,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<FamilyMember>> {
        const where: Prisma.FamilyMemberWhereInput = {
            deletedAt: null,
        }

        if (filters.customerId) {
            where.customerId = filters.customerId
        }

        if (filters.isBeneficiary !== undefined) {
            where.isBeneficiary = filters.isBeneficiary
        }

        if (filters.relationship) {
            where.relationship = filters.relationship
        }

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { relationship: { contains: filters.search, mode: 'insensitive' } },
            ]
        }

        return this.findPaginated(where, pagination)
    }

    async findByCustomerAndMemberId(
        customerId: string,
        memberId: string
    ): Promise<FamilyMember | null> {
        return this.model.findFirst({
            where: {
                id: memberId,
                customerId,
                deletedAt: null,
            },
        })
    }

    async softDelete(id: string): Promise<FamilyMember> {
        return this.model.update({
            where: { id },
            data: { deletedAt: new Date() },
        })
    }

    async countByCustomerId(customerId: string): Promise<number> {
        return this.model.count({
            where: {
                customerId,
                deletedAt: null,
            },
        })
    }
}

export const familyMemberRepository = new FamilyMemberRepository()
export default familyMemberRepository
