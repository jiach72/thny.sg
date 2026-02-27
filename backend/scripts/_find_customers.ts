import { prisma } from '../src/config/index.js'

async function main() {
    const users = await prisma.user.findMany({
        where: { role: { code: 'CUSTOMER' } },
        select: { id: true, email: true, name: true, status: true },
        take: 5
    })
    console.log('=== 客户账号列表 ===')
    console.log(JSON.stringify(users, null, 2))
    process.exit(0)
}

main()
