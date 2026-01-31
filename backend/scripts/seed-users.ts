
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10)

    // 0. Ensure Roles exist
    // Check Role model structure from schema (it has code, name, isSystem)
    const adminRoleCode = 'ADMIN'
    let adminRole = await prisma.role.findUnique({ where: { code: adminRoleCode } })
    if (!adminRole) {
        // Need to create role
        adminRole = await prisma.role.create({
            data: {
                code: 'ADMIN',
                name: '系统管理员',
                isSystem: true
            }
        })
        console.log('Created ADMIN role')
    }

    const customerRoleCode = 'CUSTOMER'
    let customerRole = await prisma.role.findUnique({ where: { code: customerRoleCode } })
    if (!customerRole) {
        customerRole = await prisma.role.create({
            data: {
                code: 'CUSTOMER',
                name: '客户',
                isSystem: true
            }
        })
        console.log('Created CUSTOMER role')
    }

    // 1. Create Admin User
    const adminEmail = 'admin@thny.sg'
    let admin = await prisma.user.findUnique({ where: { email: adminEmail } })
    if (!admin) {
        admin = await prisma.user.create({
            data: {
                email: adminEmail,
                name: 'System Admin',
                passwordHash,
                role: { connect: { code: 'ADMIN' } }, // Connect via unique code if referencing relation
                // Wait, need to check if User model uses 'role' as relation field name. 
                // Based on previous ViewFile, Role model has `users User[]`.
                // So User likely has `role Role @relation(...)`.
                // I will assume field name is `role`.
                status: 'ACTIVE'
            }
        })
        console.log('Created admin:', adminEmail)
    } else {
        console.log('Admin already exists:', adminEmail)
    }

    // 2. Create Customer User (Su Daqiang)
    const customerEmail = 'sdq@abc.com'
    let customerUser = await prisma.user.findUnique({ where: { email: customerEmail } })
    if (!customerUser) {
        customerUser = await prisma.user.create({
            data: {
                email: customerEmail,
                name: '苏大强',
                passwordHash,
                role: { connect: { code: 'CUSTOMER' } },
                status: 'ACTIVE'
            }
        })
        console.log('Created customer user:', customerEmail)
    } else {
        console.log('Customer user already exists:', customerEmail)
    }

    // 3. Link Customer Profile
    let customerProfile = await prisma.customer.findFirst({ where: { userId: customerUser.id } })
    if (!customerProfile) {
        const lead = await prisma.lead.create({
            data: {
                email: customerEmail,
                contactName: '苏大强',
                status: 'CONVERTED',
                sourceChannel: 'WEBSITE'
            }
        })

        customerProfile = await prisma.customer.create({
            data: {
                userId: customerUser.id,
                leadId: lead.id,
                companyName: '苏氏强盛集团',
                contactName: '苏大强',
                phone: '13800138000'
            }
        })
        console.log('Created customer profile for:', customerEmail)
    } else {
        console.log('Customer profile already exists')
    }

    // 4. Create Demo Project
    if (customerProfile) {
        let project = await prisma.project.findFirst({
            where: { customerId: customerProfile.id, title: '新加坡家族办公室设立' }
        })

        if (!project) {
            project = await prisma.project.create({
                data: {
                    customerId: customerProfile.id,
                    title: '新加坡家族办公室设立',
                    description: '为苏氏家族设立单一家族办公室 (SFO)，申请 13O 税务豁免。',
                    projectType: 'Enterprise Setup',
                    status: 'ACTIVE',
                    completionPercentage: 35,
                    startDate: new Date('2024-01-15'),
                    estimatedEndDate: new Date('2024-06-30')
                }
            })
            console.log('Created demo project')
        }

        // 5. Create Tasks
        const taskCount = await prisma.task.count({ where: { projectId: project.id } })
        if (taskCount === 0) {
            await prisma.task.createMany({
                data: [
                    {
                        projectId: project.id,
                        title: '初步需求沟通',
                        status: 'DONE',
                        description: '确认家族成员结构及资产规模',
                        priority: 'HIGH',
                        dueDate: new Date('2024-01-20'),
                        completedAt: new Date('2024-01-20'),
                        assignedToId: admin!.id
                    },
                    {
                        projectId: project.id,
                        title: '准备申请材料',
                        status: 'IN_PROGRESS',
                        description: '收集护照、简历、资金证明',
                        priority: 'CRITICAL',
                        dueDate: new Date('2024-02-15'),
                        assignedToId: admin!.id // Assigned to admin as consultant
                    },
                    {
                        projectId: project.id,
                        title: 'MAS 面试辅导',
                        status: 'NOT_STARTED',
                        priority: 'MEDIUM',
                        dueDate: new Date('2024-03-01'),
                        assignedToId: admin!.id
                    }
                ]
            })
            console.log('Created demo tasks')
        }

        // 6. Create Documents
        const docCount = await prisma.document.count({ where: { projectId: project.id } })
        if (docCount === 0) {
            await prisma.document.create({
                data: {
                    projectId: project.id,
                    fileName: '家族办公室架构方案_v1.pdf',
                    filePath: '#',
                    fileType: 'application/pdf',
                    fileSize: 1024 * 500,
                    documentType: 'PROPOSAL',
                    accessLevel: 'TEAM',
                    uploadedById: admin!.id
                }
            })
            console.log('Created demo documents')
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
