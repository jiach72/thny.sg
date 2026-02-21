/* eslint-disable no-console */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main(): Promise<void> {
    const email = 'admin@thny.sg'
    const newPassword = 'password123'

    console.log(`🔄 正在重置用户 ${email} 的密码...`)

    // 1. 生成新哈希
    const passwordHash = await bcrypt.hash(newPassword, 12)

    // 2. 查找用户
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
        console.error(`❌ 用户 ${email} 不存在! 请先运行 npm run db:seed`)
        return
    }

    // 3. 更新密码
    await prisma.user.update({
        where: { email },
        data: { passwordHash }
    })

    console.log(`✅ 密码已重置为: ${newPassword}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
