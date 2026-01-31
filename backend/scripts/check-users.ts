
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany()
    console.log('Users found:', users.map(u => ({ email: u.email, role: u.role })))

    const admin = users.find(u => u.email === 'admin@thny.sg')
    if (admin) {
        const isValid = await bcrypt.compare('password123', admin.passwordHash)
        console.log('Admin password valid:', isValid)
    } else {
        console.log('Admin user NOT found')
    }

    const customer = users.find(u => u.email === 'sdq@abc.com')
    if (customer) {
        const isValid = await bcrypt.compare('password123', customer.passwordHash)
        console.log('Customer password valid:', isValid)
    } else {
        console.log('Customer user NOT found')
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
