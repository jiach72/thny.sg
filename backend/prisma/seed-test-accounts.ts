
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const TEST_ACCOUNTS = [
    { email: 'client@example.com', name: '陈大文', role: 'CUSTOMER' },
    { email: 'liming@startup.io', name: '李明', role: 'CUSTOMER' },
    { email: 'harvey@global.com', name: 'Harvey Tan', role: 'CUSTOMER' },
    { email: 'zhaoliu@thny.sg', name: '赵六', role: 'MANAGER' },
    { email: 'lisi@thny.sg', name: '李四', role: 'SALES' },
]

async function main() {
    console.log('🌱 开始生成测试账号...')

    // 确保角色存在 (Customer)
    const roles = ['CUSTOMER', 'MANAGER', 'SALES']
    const roleMap = new Map<string, string>()

    for (const code of roles) {
        const role = await prisma.role.findUnique({ where: { code } })
        if (!role) {
            console.error(`❌ 角色 ${code} 不存在，请先运行主种子脚本 npm run db:seed`)
            continue // 或者报错
        }
        roleMap.set(code, role.id)
    }

    const passwordHash = await bcrypt.hash('password123', 12)

    for (const acc of TEST_ACCOUNTS) {
        const roleId = roleMap.get(acc.role)
        if (!roleId) continue

        const user = await prisma.user.upsert({
            where: { email: acc.email },
            update: {
                passwordHash,
                status: 'ACTIVE',
                roleId
            },
            create: {
                email: acc.email,
                name: acc.name,
                passwordHash,
                roleId: roleId,
                status: 'ACTIVE'
            }
        })
        console.log(`✅ 用户已创建: ${user.name} (${user.email})`)

        // 如果是客户，还需要创建 Customer 关联
        if (acc.role === 'CUSTOMER') {
            // 检查是否已有 Lead
            let lead = await prisma.lead.findFirst({ where: { email: acc.email } })
            if (!lead) {
                lead = await prisma.lead.create({
                    data: {
                        contactName: acc.name,
                        email: acc.email,
                        sourceChannel: 'MANUAL',
                        status: 'CONVERTED'
                    }
                })
            }

            await prisma.customer.upsert({
                where: { userId: user.id },
                update: {},
                create: {
                    userId: user.id,
                    leadId: lead.id,
                    contactName: acc.name,
                    kycStatus: 'APPROVED'
                }
            })
            console.log(`   └─ 客户档案已创建`)
        }
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
