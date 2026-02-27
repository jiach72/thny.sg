import { PrismaClient } from '@prisma/client'

/**
 * 共享 Prisma 客户端实例（单例模式）
 * 连接池大小通过 DATABASE_URL 的 connection_limit 参数控制
 * 例如: postgresql://user:pass@host:5432/db?connection_limit=10
 */
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
})

export default prisma
