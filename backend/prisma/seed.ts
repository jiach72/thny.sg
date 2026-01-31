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
