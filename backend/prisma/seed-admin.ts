/**
 * 管理员账号初始化脚本
 *
 * 功能：从环境变量创建管理员用户
 * 安全性：不硬编码任何密码，必须通过环境变量提供
 * 前置条件：先运行 seed-rbac.ts 确保角色存在
 *
 * 使用方式：
 *   ADMIN_EMAIL=admin@thny.sg ADMIN_PASSWORD=YourStrongP@ss1 npm run db:seed:admin
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { seedRbac } from './seed-rbac.js'

const prisma = new PrismaClient()

/**
 * 创建管理员用户（从环境变量读取凭据）
 */
export async function seedAdmin(prismaClient?: PrismaClient): Promise<void> {
    const db = prismaClient ?? prisma

    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD

    if (!email || !password) {
        console.error('❌ 请设置环境变量:')
        console.error('   ADMIN_EMAIL=admin@example.com')
        console.error('   ADMIN_PASSWORD=YourStrongPassword')
        console.error('')
        console.error('   示例: ADMIN_EMAIL=admin@thny.sg ADMIN_PASSWORD=MyP@ss123 npm run db:seed:admin')
        process.exit(1)
    }

    // 密码强度校验
    if (password.length < 8) {
        console.error('❌ 密码至少需要 8 个字符')
        process.exit(1)
    }

    // 1. 确保 RBAC 数据已初始化
    const roleMap = await seedRbac(db)
    const adminRoleId = roleMap.get('ADMIN')
    if (!adminRoleId) {
        console.error('❌ ADMIN 角色不存在，请先运行 seed-rbac')
        process.exit(1)
    }

    // 2. 创建管理员
    console.log('👤 创建管理员用户...')
    const passwordHash = await bcrypt.hash(password, 12)

    await db.user.upsert({
        where: { email },
        update: { roleId: adminRoleId },
        create: {
            email,
            name: '系统管理员',
            passwordHash,
            roleId: adminRoleId,
            department: '管理层',
        },
    })

    console.log(`  ✅ 管理员已创建/更新: ${email}`)
    console.log('')
    console.log('🎉 管理员初始化完成！')
}

// 直接运行时执行
const isDirectRun = process.argv[1]?.includes('seed-admin')
if (isDirectRun) {
    seedAdmin()
        .catch((e) => {
            console.error('❌ 管理员初始化失败:', e)
            process.exit(1)
        })
        .finally(async () => {
            await prisma.$disconnect()
        })
}
