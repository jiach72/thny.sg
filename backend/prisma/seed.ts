/**
 * 开发环境种子数据脚本
 *
 * ⚠️ 仅供开发环境使用！包含测试数据和硬编码密码。
 * 生产环境请使用：
 *   - npm run db:seed:rbac  (初始化角色权限)
 *   - npm run db:seed:admin (创建管理员，需设置 ADMIN_EMAIL / ADMIN_PASSWORD)
 *
 * 使用方式：npm run db:seed
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { seedRbac } from './seed-rbac.js'

const prisma = new PrismaClient()

// 生产环境保护
if (process.env.NODE_ENV === 'production') {
    console.error('❌ 此脚本不可在生产环境运行！')
    console.error('   生产环境请使用:')
    console.error('   - npm run db:seed:rbac  (初始化角色权限)')
    console.error('   - npm run db:seed:admin (创建管理员)')
    process.exit(1)
}

async function main(): Promise<void> {
    console.log('🌱 开始初始化开发环境数据...\n')

    // 1. RBAC 数据初始化
    const roleMap = await seedRbac(prisma)

    // 2. 创建开发用测试账号（使用默认密码）
    console.log('\n👤 创建开发测试用户...')
    const DEV_PASSWORD = 'password123'
    const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12)
    const adminRoleId = roleMap.get('ADMIN')!
    const managerRoleId = roleMap.get('MANAGER')!
    const salesRoleId = roleMap.get('SALES')!
    const customerRoleId = roleMap.get('CUSTOMER')!

    // 管理员
    await prisma.user.upsert({
        where: { email: 'admin@thny.sg' },
        update: { roleId: adminRoleId },
        create: {
            email: 'admin@thny.sg',
            name: '系统管理员',
            passwordHash,
            roleId: adminRoleId,
            department: '管理层',
        },
    })
    console.log('  ✅ admin@thny.sg (管理员)')

    // 经理/交付
    await prisma.user.upsert({
        where: { email: 'zhaoliu@thny.sg' },
        update: { roleId: managerRoleId },
        create: {
            email: 'zhaoliu@thny.sg',
            name: '赵六',
            passwordHash,
            roleId: managerRoleId,
            department: '交付部',
        },
    })
    console.log('  ✅ zhaoliu@thny.sg (交付经理)')

    // 销售顾问
    await prisma.user.upsert({
        where: { email: 'lisi@thny.sg' },
        update: { roleId: salesRoleId },
        create: {
            email: 'lisi@thny.sg',
            name: '李四',
            passwordHash,
            roleId: salesRoleId,
            department: '销售部',
        },
    })
    console.log('  ✅ lisi@thny.sg (销售顾问)')

    // 3. 创建演示客户数据
    console.log('\n👤 创建演示客户数据...')

    const demoClient = await prisma.user.upsert({
        where: { email: 'client@example.com' },
        update: { roleId: customerRoleId },
        create: {
            email: 'client@example.com',
            name: '陈大文',
            passwordHash,
            roleId: customerRoleId,
        },
    })
    console.log('  ✅ client@example.com (演示客户)')

    await prisma.user.upsert({
        where: { email: 'liming@startup.io' },
        update: { roleId: customerRoleId },
        create: {
            email: 'liming@startup.io',
            name: '李明',
            passwordHash,
            roleId: customerRoleId,
        },
    })
    console.log('  ✅ liming@startup.io (演示客户)')

    await prisma.user.upsert({
        where: { email: 'harvey@global.com' },
        update: { roleId: customerRoleId },
        create: {
            email: 'harvey@global.com',
            name: 'Harvey Tan',
            passwordHash,
            roleId: customerRoleId,
        },
    })
    console.log('  ✅ harvey@global.com (演示客户)')

    // 4. 创建 Lead & Customer
    let customer = await prisma.customer.findUnique({
        where: { userId: demoClient.id },
    })

    if (!customer) {
        console.log('  ✨ 初始化客户档案...')
        const lead = await prisma.lead.create({
            data: {
                contactName: '陈大文',
                email: 'client@example.com',
                phone: '+65 9123 4567',
                status: 'CONVERTED',
                sourceChannel: 'REFERRAL',
                serviceTypes: ['IMMIGRATION', 'TRUST'],
            }
        })

        customer = await prisma.customer.create({
            data: {
                userId: demoClient.id,
                leadId: lead.id,
                contactName: '陈大文',
                email: 'client@example.com',
                kycStatus: 'APPROVED',
                riskGrade: 'LOW',
            }
        })

        await prisma.familyMember.createMany({
            data: [
                { customerId: customer.id, name: '李梅', relationship: 'Spouse', isBeneficiary: true },
                { customerId: customer.id, name: '陈小明', relationship: 'Son', isBeneficiary: false },
                { customerId: customer.id, name: '陈小红', relationship: 'Daughter', isBeneficiary: false },
            ]
        })
    }

    // 5. 创建项目
    const projectTitle = 'Global Family Trust Setup'
    let project = await prisma.project.findFirst({
        where: { customerId: customer.id, title: projectTitle }
    })

    if (!project) {
        console.log('  🏗️ 创建演示项目: Global Family Trust Setup...')
        project = await prisma.project.create({
            data: {
                customerId: customer.id,
                title: projectTitle,
                description: '设立新加坡家族信托以进行资产保护与传承规划。',
                status: 'ACTIVE',
                projectType: 'TRUST',
                completionPercentage: 35,
                startDate: new Date('2024-01-15'),
                estimatedEndDate: new Date('2024-06-30'),
                budget: 25000,
            }
        })
    }

    // 6. 创建任务
    const pendingTaskTitle = '签署信托契约草案'
    const taskExists = await prisma.task.findFirst({
        where: { projectId: project.id, title: pendingTaskTitle }
    })

    if (!taskExists) {
        console.log('  ⚡ 创建演示任务...')

        await prisma.task.create({
            data: {
                projectId: project.id,
                title: pendingTaskTitle,
                description: '请复核并签署信托契约草案 v1。',
                status: 'NOT_STARTED',
                priority: 'CRITICAL',
                dueDate: new Date(new Date().getTime() + 86400000 * 2),
                slaHours: 48,
            }
        })

        await prisma.task.create({
            data: {
                projectId: project.id,
                title: '提交补充 KYC 材料',
                description: '需要提供配偶的护照复印件。',
                status: 'IN_PROGRESS',
                priority: 'HIGH',
                dueDate: new Date(new Date().getTime() + 86400000 * 5),
            }
        })

        await prisma.task.create({
            data: {
                projectId: project.id,
                title: '初始架构咨询会议',
                status: 'DONE',
                priority: 'MEDIUM',
                completedAt: new Date('2024-01-20'),
            }
        })
    }

    // 7. 创建文档
    const docName = 'Trust_Deed_Draft_v1.pdf'
    const docExists = await prisma.document.findFirst({
        where: { projectId: project.id, fileName: docName }
    })

    if (!docExists) {
        console.log('  📄 创建演示文档...')

        const adminUser = await prisma.user.findUnique({ where: { email: 'admin@thny.sg' } })
        if (!adminUser) throw new Error('Admin user not found')

        await prisma.document.create({
            data: {
                projectId: project.id,
                fileName: docName,
                filePath: '/uploads/demo/trust_deed.pdf',
                fileSize: 2450000,
                fileType: 'application/pdf',
                documentType: 'CONTRACT',
                uploadedById: adminUser.id
            }
        })
    }

    // 8. 扩展演示数据
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@thny.sg' } })

    // EP Application 项目 (已完成)
    const epProjectTitle = 'Singapore EP Application'
    let epProject = await prisma.project.findFirst({
        where: { customerId: customer.id, title: epProjectTitle }
    })
    if (!epProject) {
        console.log('  🏗️ 创建额外项目: Singapore EP Application...')
        epProject = await prisma.project.create({
            data: {
                customerId: customer.id,
                title: epProjectTitle,
                description: '为家庭成员申请新加坡长期居留准证(LTVP)及就业准证(EP)。',
                status: 'COMPLETED',
                projectType: 'EP Application',
                completionPercentage: 100,
                startDate: new Date('2023-09-01'),
                actualEndDate: new Date('2023-12-15'),
                budget: 12000,
            }
        })
        if (adminUser) {
            await prisma.document.create({
                data: {
                    projectId: epProject.id,
                    fileName: 'EP_Approval_Letter_Tan.pdf',
                    filePath: '/uploads/demo/ep_approval.pdf',
                    fileSize: 156000,
                    fileType: 'application/pdf',
                    documentType: 'GOVERNMENT_LETTER',
                    uploadedById: adminUser.id,
                    createdAt: new Date('2023-12-10')
                }
            })
        }
    }

    // Tax Planning 项目 (规划中)
    const taxProjectTitle = 'Corporate Tax Planning 2024'
    let taxProject = await prisma.project.findFirst({
        where: { customerId: customer.id, title: taxProjectTitle }
    })
    if (!taxProject) {
        console.log('  🏗️ 创建额外项目: Corporate Tax Planning 2024...')
        taxProject = await prisma.project.create({
            data: {
                customerId: customer.id,
                title: taxProjectTitle,
                description: '2024财年企业税务架构优化及合规申报服务。',
                status: 'PLANNING',
                projectType: 'Tax Planning',
                completionPercentage: 15,
                startDate: new Date('2024-02-01'),
                estimatedEndDate: new Date('2024-11-30'),
                budget: 8000,
            }
        })

        await prisma.task.create({
            data: {
                projectId: taxProject.id,
                title: '提交 2023 财务报表',
                status: 'NOT_STARTED',
                priority: 'HIGH',
                dueDate: new Date('2024-03-31'),
                description: '请上传上一财年的经审计财务报表。'
            }
        })
    }

    console.log('\n🎉 开发环境数据初始化完成!')
    console.log('\n📋 测试账号（仅限开发环境）:')
    console.log(`  - 管理员: admin@thny.sg / ${DEV_PASSWORD}`)
    console.log(`  - 经理: zhaoliu@thny.sg / ${DEV_PASSWORD}`)
    console.log(`  - 销售: lisi@thny.sg / ${DEV_PASSWORD}`)
    console.log(`  - 客户: client@example.com / ${DEV_PASSWORD}`)
}

main()
    .catch((e) => {
        console.error('❌ 初始化失败:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
