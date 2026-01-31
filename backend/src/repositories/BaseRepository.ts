import { prisma } from '../config/index.js'
import type { PrismaClient } from '@prisma/client'

/**
 * 基础 Repository 接口
 */
export interface IBaseRepository<T, CreateInput, UpdateInput> {
    findById(id: string): Promise<T | null>
    findAll(filters?: any): Promise<T[]>
    create(data: CreateInput): Promise<T>
    update(id: string, data: UpdateInput): Promise<T>
    delete(id: string): Promise<T>
    count(filters?: any): Promise<number>
}

/**
 * 分页选项
 */
export interface PaginationOptions {
    page: number
    limit: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

/**
 * 基础 Repository 抽象类
 * 封装通用的 CRUD 操作
 */
export abstract class BaseRepository<T, CreateInput, UpdateInput> implements IBaseRepository<T, CreateInput, UpdateInput> {
    protected prisma: PrismaClient
    protected abstract modelName: string

    constructor() {
        this.prisma = prisma
    }

    /**
     * 获取 Prisma 模型代理
     */
    protected get model(): any {
        return (this.prisma as any)[this.modelName]
    }

    /**
     * 根据 ID 查找
     */
    async findById(id: string, include?: any): Promise<T | null> {
        return this.model.findUnique({
            where: { id },
            include
        })
    }

    /**
     * 查找所有记录
     */
    async findAll(filters?: any, include?: any): Promise<T[]> {
        return this.model.findMany({
            where: filters,
            include
        })
    }

    /**
     * 分页查询
     */
    async findPaginated(
        filters: any,
        pagination: PaginationOptions,
        include?: any
    ): Promise<PaginatedResult<T>> {
        const { page, limit, sortBy, sortOrder } = pagination
        const skip = (page - 1) * limit

        const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined

        const [data, total] = await Promise.all([
            this.model.findMany({
                where: filters,
                skip,
                take: limit,
                orderBy,
                include
            }),
            this.model.count({ where: filters })
        ])

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    /**
     * 创建记录
     */
    async create(data: CreateInput, include?: any): Promise<T> {
        return this.model.create({
            data,
            include
        })
    }

    /**
     * 更新记录
     */
    async update(id: string, data: UpdateInput, include?: any): Promise<T> {
        return this.model.update({
            where: { id },
            data,
            include
        })
    }

    /**
     * 删除记录
     */
    async delete(id: string): Promise<T> {
        return this.model.delete({
            where: { id }
        })
    }

    /**
     * 计数
     */
    async count(filters?: any): Promise<number> {
        return this.model.count({
            where: filters
        })
    }

    /**
     * 检查是否存在
     */
    async exists(id: string): Promise<boolean> {
        const count = await this.model.count({
            where: { id }
        })
        return count > 0
    }

    /**
     * 根据条件查找单条记录
     */
    async findFirst(filters: any, include?: any): Promise<T | null> {
        return this.model.findFirst({
            where: filters,
            include
        })
    }

    /**
     * 批量创建
     */
    async createMany(data: CreateInput[]): Promise<{ count: number }> {
        return this.model.createMany({
            data,
            skipDuplicates: true
        })
    }

    /**
     * 批量更新
     */
    async updateMany(filters: any, data: UpdateInput): Promise<{ count: number }> {
        return this.model.updateMany({
            where: filters,
            data
        })
    }

    /**
     * 批量删除
     */
    async deleteMany(filters: any): Promise<{ count: number }> {
        return this.model.deleteMany({
            where: filters
        })
    }

    /**
     * 事务操作
     */
    async transaction<R>(fn: (tx: PrismaClient) => Promise<R>): Promise<R> {
        return this.prisma.$transaction(fn as any) as Promise<R>
    }
}

export default BaseRepository
