import { BaseRepository, PaginationOptions, PaginatedResult } from './BaseRepository.js'
import type { Customer, Prisma } from '@prisma/client'

/**
 * Customer 过滤条件
 */
export interface CustomerFilters {
    search?: string
    deletedAt?: 'include' | 'exclude'
}

/**
 * Customer Repository
 * 封装客户相关的数据库操作
 */
export class CustomerRepository extends BaseRepository<Customer, Prisma.CustomerCreateInput, Prisma.CustomerUpdateInput> {
    protected modelName = 'customer'

    /**
     * 默认关联查询
     */
    private defaultInclude = {
        lead: {
            select: {
                contactName: true,
                companyName: true,
                email: true,
                phone: true,
            }
        }
    }

    /**
     * 详情关联查询
     */
    private detailInclude = {
        lead: true,
        projects: {
            orderBy: { updatedAt: 'desc' as const },
            include: {
                _count: {
                    select: { tasks: true, documents: true }
                }
            }
        },
        appointments: {
            orderBy: { startTime: 'desc' as const },
            take: 5
        }
    }

    /**
     * 搜索客户（用于下拉选择）
     */
    async findForSelect(search?: string, limit: number = 50): Promise<Customer[]> {
        const where: Prisma.CustomerWhereInput = search ? {
            OR: [
                { lead: { contactName: { contains: search, mode: 'insensitive' } } },
                { lead: { companyName: { contains: search, mode: 'insensitive' } } },
            ]
        } : {}

        return this.model.findMany({
            where,
            select: {
                id: true,
                lead: {
                    select: {
                        contactName: true,
                        companyName: true,
                        email: true
                    }
                },
                companyInfo: true
            },
            take: limit
        })
    }

    /**
     * 获取客户详情（含关联数据）
     */
    async findCustomerWithDetails(id: string): Promise<Customer | null> {
        return this.model.findUnique({
            where: { id },
            include: this.detailInclude
        })
    }

    /**
     * 分页查询客户列表
     */
    async findCustomers(
        filters: CustomerFilters,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<Customer>> {
        const where: Prisma.CustomerWhereInput = {}

        if (filters.search) {
            where.OR = [
                { lead: { contactName: { contains: filters.search, mode: 'insensitive' } } },
                { lead: { companyName: { contains: filters.search, mode: 'insensitive' } } },
                { lead: { email: { contains: filters.search, mode: 'insensitive' } } },
            ]
        }

        if (filters.deletedAt !== 'include') {
            where.deletedAt = null
        }

        return this.findPaginated(where, pagination, this.defaultInclude)
    }

    /**
     * 根据用户 ID 查找客户
     */
    async findByUserId(userId: string): Promise<Customer | null> {
        return this.model.findFirst({
            where: { userId },
            include: this.defaultInclude
        })
    }

    /**
     * 根据邮箱查找客户
     */
    async findByEmail(email: string): Promise<Customer | null> {
        return this.model.findFirst({
            where: { lead: { email } },
            include: this.defaultInclude
        })
    }
}

// 单例导出
export const customerRepository = new CustomerRepository()
export default customerRepository
