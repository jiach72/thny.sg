import { prisma } from '../config/index.js'
import { Prisma } from '@prisma/client'
import { webhookService } from './webhookService.js'
import logger from '../config/logger.js'

export const projectService = {
    // 获取项目列表（支持分页、筛选）
    async getProjects(params: {
        page?: number
        limit?: number
        status?: string
        customerId?: string
    }) {
        const page = params.page || 1
        const limit = params.limit || 10
        const skip = (page - 1) * limit

        const where: Prisma.ProjectWhereInput = {}
        if (params.status) where.status = params.status as Prisma.EnumProjectStatusFilter
        if (params.customerId) where.customerId = params.customerId

        const [total, projects] = await Promise.all([
            prisma.project.count({ where }),
            prisma.project.findMany({
                where,
                skip,
                take: limit,
                include: {
                    customer: {
                        include: {
                            lead: {
                                select: { contactName: true, companyName: true }
                            }
                        }
                    },
                    tasks: {
                        select: { id: true, status: true } // 用于计算简易进度
                    },
                    _count: {
                        select: { tasks: true, documents: true }
                    }
                },
                orderBy: { updatedAt: 'desc' }
            })
        ])

        return {
            data: projects,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }
    },

    async getMyProjects(customerEmail: string) {
        return prisma.project.findMany({
            where: {
                customer: {
                    lead: {
                        email: customerEmail
                    }
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
    },

    // 客户获取自己的项目详情
    async getMyProjectById(id: string, customerEmail: string) {
        return prisma.project.findFirst({
            where: {
                id,
                customer: {
                    lead: {
                        email: customerEmail
                    }
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
                        accessLevel: { in: ['PUBLIC', 'TEAM'] } // 门户能查看的文档级别（暂定）
                    },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        uploadedBy: { select: { name: true } }
                    }
                }
            }
        })
    },

    // 获取单个项目详情
    async getProjectById(id: string) {
        return prisma.project.findUnique({
            where: { id },
            include: {
                customer: {
                    include: {
                        lead: true
                    }
                },
                tasks: {
                    include: {
                        assignedTo: { select: { id: true, name: true, avatarUrl: true } }
                    },
                    orderBy: { dueDate: 'asc' }
                },
                documents: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: 'desc' },
                    include: { uploadedBy: { select: { id: true, name: true } } }
                }
            }
        })
    },

    // 创建项目
    async createProject(data: {
        title: string
        description?: string
        customerId: string
        projectType: string
        startDate?: string
        estimatedEndDate?: string
        budget?: number
        currency?: string
    }) {
        const project = await prisma.project.create({
            data: {
                title: data.title,
                description: data.description,
                customerId: data.customerId,
                projectType: data.projectType,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                estimatedEndDate: data.estimatedEndDate ? new Date(data.estimatedEndDate) : undefined,
                budget: data.budget,
                currency: data.currency || 'SGD',
                status: 'PLANNING'
            }
        })
        webhookService.emit('project.created', project).catch(err => logger.error('Webhook推送失败', err))
        return project
    },

    // 更新项目
    async updateProject(id: string, data: Prisma.ProjectUpdateInput) {
        return prisma.project.update({
            where: { id },
            data
        })
    },

    // 更新项目状态（看板拖拽用）
    async updateStatus(id: string, status: string) {
        const project = await prisma.project.update({
            where: { id },
            data: { status: status as Prisma.EnumProjectStatusFieldUpdateOperationsInput }
        })
        webhookService.emit('project.statusChanged', project).catch(err => logger.error('Webhook推送失败', err))
        return project
    },

    // 删除项目
    async deleteProject(id: string) {
        return prisma.project.delete({
            where: { id }
        })
    }
}
