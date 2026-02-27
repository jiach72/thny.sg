import { prisma } from '../src/config/index.js'
import bcrypt from 'bcryptjs'

async function main() {
    const hash = await bcrypt.hash('Test@123456', 10)
    await prisma.user.update({
        where: { email: 'harvey@global.com' },
        data: { passwordHash: hash }
    })
    console.log('✅ 已将 harvey@global.com 的密码重置为 Test@123456')
    process.exit(0)
}

main()
