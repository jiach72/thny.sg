import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ==================== 权限定义 ====================
const PERMISSIONS = [
    // 线索管理
    { code: 'leads:create', name: '创建线索', resource: 'leads', action: 'create' },
    { code: 'leads:read', name: '查看线索', resource: 'leads', action: 'read' },
    { code: 'leads:update', name: '编辑线索', resource: 'leads', action: 'update' },
    { code: 'leads:delete', name: '删除线索', resource: 'leads', action: 'delete' },
    { code: 'leads:assign', name: '分配线索', resource: 'leads', action: 'assign' },

    // 客户管理
    { code: 'customers:create', name: '创建客户', resource: 'customers', action: 'create' },
    { code: 'customers:read', name: '查看客户', resource: 'customers', action: 'read' },
    { code: 'customers:update', name: '编辑客户', resource: 'customers', action: 'update' },
    { code: 'customers:delete', name: '删除客户', resource: 'customers', action: 'delete' },

    // 项目管理
    { code: 'projects:create', name: '创建项目', resource: 'projects', action: 'create' },
    { code: 'projects:read', name: '查看项目', resource: 'projects', action: 'read' },
    { code: 'projects:update', name: '编辑项目', resource: 'projects', action: 'update' },
    { code: 'projects:delete', name: '删除项目', resource: 'projects', action: 'delete' },

    // 任务管理
    { code: 'tasks:create', name: '创建任务', resource: 'tasks', action: 'create' },
    { code: 'tasks:read', name: '查看任务', resource: 'tasks', action: 'read' },
    { code: 'tasks:update', name: '编辑任务', resource: 'tasks', action: 'update' },
    { code: 'tasks:delete', name: '删除任务', resource: 'tasks', action: 'delete' },

    // 文档管理
    { code: 'documents:upload', name: '上传文档', resource: 'documents', action: 'upload' },
    { code: 'documents:read', name: '查看文档', resource: 'documents', action: 'read' },
    { code: 'documents:delete', name: '删除文档', resource: 'documents', action: 'delete' },

    // 消息管理
    { code: 'messages:send', name: '发送消息', resource: 'messages', action: 'send' },
    { code: 'messages:read', name: '查看消息', resource: 'messages', action: 'read' },

    // 用户管理
    { code: 'users:create', name: '创建用户', resource: 'users', action: 'create' },
    { code: 'users:read', name: '查看用户', resource: 'users', action: 'read' },
    { code: 'users:update', name: '编辑用户', resource: 'users', action: 'update' },
    { code: 'users:delete', name: '删除用户', resource: 'users', action: 'delete' },

    // RBAC 权限管理 (仅 ADMIN)
    { code: 'rbac:manage', name: '权限管理', resource: 'rbac', action: 'manage' },
]

// ==================== 角色定义 ====================
const ROLES = [
    { code: 'ADMIN', name: '管理员', description: '系统管理员，拥有所有权限', isSystem: true },
    { code: 'MANAGER', name: '经理', description: '部门经理', isSystem: true },
    { code: 'SALES', name: '销售', description: '销售人员', isSystem: true },
    { code: 'DELIVERY', name: '交付', description: '交付团队成员', isSystem: true },
    { code: 'COMPLIANCE', name: '合规', description: '合规人员', isSystem: true },
    { code: 'FINANCE', name: '财务', description: '财务人员', isSystem: true },
    { code: 'CUSTOMER', name: '客户', description: '客户账户', isSystem: true },
]

// ==================== 角色-权限映射 ====================
const ROLE_PERMISSIONS: Record<string, string[]> = {
    // ADMIN 拥有所有权限 (通过代码兜底，这里可以不配)
    ADMIN: PERMISSIONS.map(p => p.code),

    MANAGER: [
        'leads:create', 'leads:read', 'leads:update', 'leads:delete', 'leads:assign',
        'customers:create', 'customers:read', 'customers:update',
        'projects:create', 'projects:read', 'projects:update', 'projects:delete',
        'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
        'documents:upload', 'documents:read', 'documents:delete',
        'messages:send', 'messages:read',
        'users:read',
    ],

    SALES: [
        'leads:create', 'leads:read', 'leads:update',
        'customers:read',
        'projects:read',
        'tasks:create', 'tasks:read', 'tasks:update',
        'documents:upload', 'documents:read',
        'messages:send', 'messages:read',
    ],

    DELIVERY: [
        'leads:read',
        'customers:read', 'customers:update',
        'projects:read', 'projects:update',
        'tasks:create', 'tasks:read', 'tasks:update',
        'documents:upload', 'documents:read',
        'messages:send', 'messages:read',
    ],

    COMPLIANCE: [
        'customers:read', 'customers:update',
        'projects:read',
        'documents:read',
    ],

    FINANCE: [
        'customers:read',
        'projects:read',
        'documents:read',
    ],

    CUSTOMER: [
        // 客户通过 portal 路由访问，不需要 CRM 权限
    ],
}

async function main() {
    console.log('🌱 开始初始化 RBAC 数据...')

    // 1. 创建/更新角色 (幂等)
    console.log('📋 创建角色...')
    const roleMap = new Map<string, string>() // code -> id

    for (const roleData of ROLES) {
        const role = await prisma.role.upsert({
            where: { code: roleData.code },
            update: { name: roleData.name, description: roleData.description },
            create: roleData,
        })
        roleMap.set(role.code, role.id)
        console.log(`  ✅ ${role.code} (${role.name})`)
    }

    // 2. 创建/更新权限 (幂等)
    console.log('🔑 创建权限...')
    const permissionMap = new Map<string, string>() // code -> id

    for (const permData of PERMISSIONS) {
        const permission = await prisma.permission.upsert({
            where: { code: permData.code },
            update: { name: permData.name, resource: permData.resource, action: permData.action },
            create: permData,
        })
        permissionMap.set(permission.code, permission.id)
    }
    console.log(`  ✅ 共 ${PERMISSIONS.length} 个权限`)

    // 3. 设置角色-权限关联 (只创建不存在的，不覆盖已修改的)
    console.log('🔗 设置角色权限...')

    for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
        const roleId = roleMap.get(roleCode)
        if (!roleId) continue

        for (const permCode of permCodes) {
            const permissionId = permissionMap.get(permCode)
            if (!permissionId) continue

            // 使用 upsert 避免重复创建
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId, permissionId } },
                update: {},
                create: { roleId, permissionId },
            })
        }
        console.log(`  ✅ ${roleCode}: ${permCodes.length} 个权限`)
    }

    // 4. 创建管理员用户 (如果不存在)
    console.log('👤 创建管理员用户...')
    const passwordHash = await bcrypt.hash('password123', 12)
    const adminRoleId = roleMap.get('ADMIN')!
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

    // 5. 创建演示客户数据 (client@example.com)
    console.log('👤 创建演示客户数据...')

    // 5.1 创建 User
    const demoClient = await prisma.user.upsert({
        where: { email: 'client@example.com' },
        update: { roleId: customerRoleId },
        create: {
            email: 'client@example.com',
            name: '陈大文',
            passwordHash, // 使用相同的密码 password123
            roleId: customerRoleId,
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
    })
    console.log('  ✅ client@example.com (演示客户)')

    // 5.2 创建 Lead & Customer (如果是新用户)
    // 检查是否有关联客户，没有则创建
    let customer = await prisma.customer.findUnique({
        where: { userId: demoClient.id },
    })

    if (!customer) {
        console.log('  ✨ 初始化客户档案...')
        // 先创建 Lead
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

        // 创建 Customer
        customer = await prisma.customer.create({
            data: {
                userId: demoClient.id,
                leadId: lead.id,
                contactName: '陈大文',
                email: 'client@example.com',
                kycStatus: 'APPROVED',
                riskGrade: 'LOW',
                familyMembers: {
                    spouse: { name: '李梅', relation: 'Spouse' },
                    children: [
                        { name: '陈小明', relation: 'Son', age: 10 },
                        { name: '陈小红', relation: 'Daughter', age: 8 }
                    ]
                }
            }
        })
    }

    // 5.3 创建项目 (Global Family Trust Setup)
    const projectTitle = 'Global Family Trust Setup'
    let project = await prisma.project.findFirst({
        where: {
            customerId: customer.id,
            title: projectTitle
        }
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

    // 5.4 创建任务 (Action Center Items)
    const pendingTaskTitle = '签署信托契约草案'
    const taskExists = await prisma.task.findFirst({
        where: { projectId: project.id, title: pendingTaskTitle }
    })

    if (!taskExists) {
        console.log('  ⚡ 创建演示任务...')

        // 任务 1: 待签署 (高优)
        await prisma.task.create({
            data: {
                projectId: project.id,
                title: pendingTaskTitle,
                description: '请复核并签署信托契约草案 v1。',
                status: 'NOT_STARTED',
                priority: 'CRITICAL',
                dueDate: new Date(new Date().getTime() + 86400000 * 2), // +2 days
                slaHours: 48,
            }
        })

        // 任务 2: 补充 KYC (中优)
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

        // 任务 3: 初始咨询 (已完成)
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

    // 5.5 创建文档
    const docName = 'Trust_Deed_Draft_v1.pdf'
    const docExists = await prisma.document.findFirst({
        where: { projectId: project.id, fileName: docName }
    })

    if (!docExists) {
        console.log('  📄 创建演示文档...')

        const adminUser = await prisma.user.findUnique({ where: { email: 'admin@thny.sg' } })
        if (!adminUser) throw new Error('Admin user not found')

        // 文档 1: 待办
        await prisma.document.create({
            data: {
                projectId: project.id,
                fileName: docName,
                filePath: '/uploads/demo/trust_deed.pdf', // 虚拟路径
                fileSize: 2450000,
                fileType: 'application/pdf',
                documentType: 'CONTRACT',
                uploadedById: adminUser.id
            }
        })
    } else {
        // 如果文档已存在，不做任何事，或者更新
    }

    // ==========================================
    // 5.6 扩展演示数据 (更多项目与文档)
    // ==========================================

    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@thny.sg' } })

    // Project A: Singapore EP Application (已完成)
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
        // 文档 for EP
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

    // Project B: Corporate Tax Planning 2024 (规划中)
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

        // 任务 for Tax
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

    console.log('\n🎉 RBAC 数据初始化完成!')
    console.log('\n📋 管理员账号:')
    console.log('  - 邮箱: admin@thny.sg')
    console.log('  - 密码: password123')
}

main()
    .catch((e) => {
        console.error('❌ 初始化失败:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
