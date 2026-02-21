/* eslint-disable no-console */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main(): Promise<void> {
    console.log('🥜 开始生成苏大强测试数据...')

    const email = 'sdq@abc.com'
    const password = 'password123'

    // 1. 确保 CUSTOMER 角色存在
    const customerRole = await prisma.role.findUnique({ where: { code: 'CUSTOMER' } })
    if (!customerRole) {
        throw new Error('系统错误: CUSTOMER 角色不存在，请先运行主种子脚本')
    }

    // 2. 创建用户账号
    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash, // 确保密码被重置
            status: 'ACTIVE'
        },
        create: {
            email,
            name: '苏大强',
            passwordHash,
            roleId: customerRole.id,
            status: 'ACTIVE',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sdq&backgroundColor=b6e3f4'
        }
    })
    console.log(`👤 用户已创建: ${user.name} (${user.email})`)

    // 3. 创建/更新客户档案
    // 先检查是否已有 Lead，为了完整性我们创建一个“已转换”的 Lead
    const lead = await prisma.lead.create({
        data: {
            contactName: '苏大强',
            email: email,
            phone: '88886666',
            sourceChannel: 'REFERRAL',
            status: 'CONVERTED',
            inquiryMessage: '我要把老宅子重新装修一下，要气派！',
            assignedToId: user.id // 假设自指，或留空
        }
    })

    const customer = await prisma.customer.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            leadId: lead.id,
            contactName: '苏大强',
            phone: '88886666',
            companyName: '苏氏家族',
            riskGrade: 'MEDIUM',
            familyMembers: {
                children: ['苏明哲', '苏明成', '苏明玉']
            },
            kycStatus: 'APPROVED'
        }
    })
    console.log(`📋 客户档案已建立: ID ${customer.id}`)

    // 4. 创建项目 "苏宅适老化改造"
    const project = await prisma.project.create({
        data: {
            customerId: customer.id,
            title: '苏宅适老化改造工程',
            description: '主卧增加隔音，客厅安装地暖，厨房要全自动咖啡机位。',
            projectType: 'RENOVATION',
            status: 'ACTIVE',
            budget: 80000,
            completionPercentage: 15,
            startDate: new Date(),
            estimatedEndDate: new Date(new Date().setDate(new Date().getDate() + 90))
        }
    })
    console.log(`🏠 项目已创建: ${project.title}`)

    // 5. 创建一些任务
    await prisma.task.createMany({
        data: [
            {
                title: '确认主卧设计图',
                projectId: project.id,
                status: 'IN_PROGRESS',
                priority: 'HIGH',
                description: '一定要宽敞，要朝南！',
                dueDate: new Date(new Date().setDate(new Date().getDate() + 3))
            },
            {
                title: '选购进口手磨咖啡机',
                projectId: project.id,
                status: 'NOT_STARTED',
                priority: 'MEDIUM',
                description: '我不吃麦片，我要喝手磨咖啡！',
            }
        ]
    })
    console.log(`✅ 已添加项目任务`)

    // 6. 创建预约
    await prisma.appointment.create({
        data: {
            userId: user.id,
            customerId: customer.id,
            title: '第二次现场量房',
            startTime: new Date(new Date().setDate(new Date().getDate() + 1)), // 明天
            endTime: new Date(new Date().setDate(new Date().getDate() + 1)),
            type: 'VISIT',
            status: 'SCHEDULED',
            location: '苏家老宅'
        }
    })
    console.log(`📅 已预约上门`)

    // 7. 发送一条系统消息
    await prisma.message.create({
        data: {
            senderId: user.id, // 自发自收模拟，或者通常是系统发
            recipientId: user.id,
            title: '欢迎加入通海南洋',
            content: '苏先生，您的装修申请已通过审核，项目经理将很快联系您。',
            type: 'SYSTEM',
            isRead: false
        }
    })

    console.log('\n🎉 苏大强测试数据生成完毕！')
    console.log('--------------------------------')
    console.log(`账号: ${email}`)
    console.log(`密码: ${password}`)
    console.log('--------------------------------')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
