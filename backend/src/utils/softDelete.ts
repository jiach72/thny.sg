/**
 * 软删除工具类
 * 提供统一的软删除和恢复功能
 */

import { PrismaClient } from '@prisma/client'

// 支持软删除的模型类型
type SoftDeletableModel =
    | 'lead'
    | 'customer'
    | 'project'
    | 'task'
    | 'invoice'
    | 'payment'

/**
 * 软删除记录
 * @param prisma - Prisma 客户端实例
 * @param model - 模型名称
 * @param id - 记录 ID
 * @returns 更新后的记录
 */
export async function softDelete<T>(
    prisma: PrismaClient,
    model: SoftDeletableModel,
    id: string
): Promise<T> {
    const modelDelegate = prisma[model] as any
    return modelDelegate.update({
        where: { id },
        data: { deletedAt: new Date() }
    })
}

/**
 * 批量软删除记录
 * @param prisma - Prisma 客户端实例
 * @param model - 模型名称
 * @param ids - 记录 ID 数组
 * @returns 更新的记录数量
 */
export async function softDeleteMany(
    prisma: PrismaClient,
    model: SoftDeletableModel,
    ids: string[]
): Promise<{ count: number }> {
    const modelDelegate = prisma[model] as any
    return modelDelegate.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() }
    })
}

/**
 * 恢复软删除的记录
 * @param prisma - Prisma 客户端实例
 * @param model - 模型名称
 * @param id - 记录 ID
 * @returns 恢复后的记录
 */
export async function restore<T>(
    prisma: PrismaClient,
    model: SoftDeletableModel,
    id: string
): Promise<T> {
    const modelDelegate = prisma[model] as any
    return modelDelegate.update({
        where: { id },
        data: { deletedAt: null }
    })
}

/**
 * 检查记录是否已被软删除
 * @param prisma - Prisma 客户端实例
 * @param model - 模型名称
 * @param id - 记录 ID
 * @returns 是否已删除
 */
export async function isDeleted(
    prisma: PrismaClient,
    model: SoftDeletableModel,
    id: string
): Promise<boolean> {
    const modelDelegate = prisma[model] as any
    const record = await modelDelegate.findUnique({
        where: { id },
        select: { deletedAt: true }
    })
    return record?.deletedAt !== null
}

/**
 * 创建带软删除过滤的查询条件
 * @param includeDeleted - 是否包含已删除记录
 * @returns 查询条件对象
 */
export function withSoftDeleteFilter(includeDeleted = false) {
    return includeDeleted ? {} : { deletedAt: null }
}

/**
 * 永久删除记录（物理删除）
 * 注意：此操作不可恢复！
 * @param prisma - Prisma 客户端实例
 * @param model - 模型名称
 * @param id - 记录 ID
 * @returns 删除的记录
 */
export async function permanentDelete<T>(
    prisma: PrismaClient,
    model: SoftDeletableModel,
    id: string
): Promise<T> {
    const modelDelegate = prisma[model] as any
    return modelDelegate.delete({
        where: { id }
    })
}
