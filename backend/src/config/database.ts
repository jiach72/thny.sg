import { PrismaClient } from '@prisma/client'

/**
 * 共享 Prisma 客户端实例（单例模式）
 *
 * 连接池配置策略：
 * 1. 生产环境：env.ts 自动在 DATABASE_URL 末尾注入 connection_limit=20&pool_timeout=10
 * 2. 开发/测试环境：使用 Prisma 默认值（num_cpus*2+1）
 * 3. 手动覆盖：在 .env 的 DATABASE_URL 中显式添加参数即可跳过自动注入
 */
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
})

export default prisma
