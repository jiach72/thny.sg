import { BaseRepository, PaginationOptions, PaginatedResult } from './BaseRepository.js'
import type { Project, Prisma } from '@prisma/client'

/**
 * Project 过滤条件
 */
export interface ProjectFilters {
    status?: string
    customerId?: string
}

/**
 * Project Repository
 * 封装项目相关的数据库操作
 */
export class ProjectRepository extends BaseRepository<Project, Prisma.ProjectUncheckedCreateInput, Prisma.ProjectUncheckedUpdateInput> {
    protected modelName = 'project'

    /**
     * 列表关联查询
     */
    private listInclude = {
        customer: {
            include: {
                lead: {
                    select: { contactName: true, companyName: true }
                }
            }
        },
        tasks: {
            select: { id: true, status: true }
        },
        _count: {
            select: { tasks: true, documents: true }
        }
    }

    /**
     * 详情关联查询
     */
    private detailInclude = {
        customer: {
            include: { lead: true }
        },
        tasks: {
            include: {
                assignedTo: { select: { id: true, name: true, avatarUrl: true } }
            },
            orderBy: { dueDate: 'asc' as const }
        },
        documents: {
            orderBy: { createdAt: 'desc' as const },
            include: {
                uploadedBy: { select: { name: true } }
            }
        }
    }

    /**
     * 分页查询项目列表
     */
    async findProjects(
        filters: ProjectFilters,
        pagination: PaginationOptions
    ): Promise<PaginatedResult<Project>> {
        const where: Prisma.ProjectWhereInput = {}
        if (filters.status) where.status = filters.status as any
        if (filters.customerId) where.customerId = filters.customerId

        return this.findPaginated(where, pagination, this.listInclude)
    }

    /**
     * 获取项目详情
     */
    async findProjectWithDetails(id: string): Promise<Project | null> {
        return this.model.findUnique({
            where: { id },
            include: this.detailInclude
        })
    }

    /**
     * 获取客户的项目列表（客户门户）
     */
    async findByCustomerEmail(customerEmail: string): Promise<Project[]> {
        return this.model.findMany({
            where: {
                customer: {
                    lead: { email: customerEmail }
                }
            },
            include: {
                tasks: {
                    select: { id: true, status: true }
                },
                _count: {
                    select: { tasks: true, documents: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        })
    }

    /**
     * 获取客户的单个项目详情（含权限校验）
     */
    async findByIdAndCustomerEmail(id: string, customerEmail: string): Promise<Project | null> {
        return this.model.findFirst({
            where: {
                id,
                customer: {
                    lead: { email: customerEmail }
                }
            },
            include: {
                tasks: {
                    include: {
                        assignedTo: { select: { id: true, name: true, avatarUrl: true } }
                    },
                    orderBy: { dueDate: 'asc' }
                },
                documents: {
                    where: {
                        accessLevel: { in: ['PUBLIC', 'TEAM'] }
                    },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        uploadedBy: { select: { name: true } }
                    }
                }
            }
        })
    }

    /**
     * 更新项目状态
     */
    async updateStatus(id: string, status: string): Promise<Project> {
        return this.model.update({
            where: { id },
            data: { status: status as any }
        })
    }
}

// 单例导出
export const projectRepository = new ProjectRepository()
export default projectRepository
