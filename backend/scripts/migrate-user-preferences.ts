import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateUserPreferences() {
    console.log('开始迁移用户偏好设置...')

    const customersWithPrefs = await prisma.customer.findMany({
        where: {
            profileNotes: {
                contains: '<!-- PREFERENCES -->'
            }
        },
        include: {
            user: true
        }
    })

    console.log(`找到 ${customersWithPrefs.length} 个包含旧格式偏好设置的客户`)

    let migratedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const customer of customersWithPrefs) {
        if (!customer.user) {
            skippedCount++
            continue
        }

        try {
            const prefMarker = '<!-- PREFERENCES -->'
            const regex = new RegExp(`${prefMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${prefMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
            const match = customer.profileNotes?.match(regex)

            if (match) {
                const jsonStr = match[0].replace(new RegExp(prefMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '').trim()
                const oldPrefs = JSON.parse(jsonStr)

                const existing = await prisma.userPreferences.findUnique({
                    where: { userId: customer.user.id }
                })

                if (existing) {
                    console.log(`  用户 ${customer.user.email} 已有偏好记录，跳过`)
                    skippedCount++
                } else {
                    await prisma.userPreferences.create({
                        data: {
                            userId: customer.user.id,
                            emailNotifications: oldPrefs.email ?? oldPrefs.emailNotifications ?? true,
                            smsNotifications: oldPrefs.sms ?? oldPrefs.smsNotifications ?? false,
                            projectUpdate: oldPrefs.projectUpdate ?? true,
                            documentReminder: oldPrefs.documentReminder ?? true,
                            darkMode: oldPrefs.darkMode ?? true,
                            compactMode: oldPrefs.compactMode ?? false,
                            animations: oldPrefs.animations ?? true,
                            language: oldPrefs.language ?? 'zh-CN',
                            timezone: oldPrefs.timezone ?? 'Asia/Singapore',
                            activityLog: oldPrefs.activityLog ?? true,
                            loginNotification: oldPrefs.loginNotification ?? true,
                        }
                    })
                    console.log(`  ✓ 迁移用户 ${customer.user.email} 的偏好设置`)
                    migratedCount++
                }

                const cleanedNotes = customer.profileNotes?.replace(regex, '').trim() || null
                await prisma.customer.update({
                    where: { id: customer.id },
                    data: { profileNotes: cleanedNotes || null }
                })
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error)
            errors.push(`用户 ${customer.user.email}: ${msg}`)
            console.error(`  ✗ 迁移用户 ${customer.user.email} 失败: ${msg}`)
        }
    }

    console.log('\n迁移完成:')
    console.log(`  总计: ${customersWithPrefs.length}`)
    console.log(`  成功: ${migratedCount}`)
    console.log(`  跳过: ${skippedCount}`)
    console.log(`  失败: ${errors.length}`)

    if (errors.length > 0) {
        console.log('\n失败详情:')
        errors.forEach(e => console.log(`  - ${e}`))
    }
}

migrateUserPreferences()
    .catch((e) => {
        console.error('迁移脚本执行失败:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
