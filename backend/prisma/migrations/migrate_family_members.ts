import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface LegacyFamilyMember {
    id?: string
    name?: string
    relationship?: string
    relation?: string
    isBeneficiary?: boolean
    beneficiary?: boolean
    createdAt?: string
    updatedAt?: string
    age?: number
}

interface LegacyFamilyMembers {
    spouse?: { name: string; relation: string }
    children?: (string | LegacyFamilyMember)[]
    [key: string]: unknown
}

async function migrateFamilyMembers() {
    console.log('开始迁移家庭成员数据...')

    const customers = await prisma.customer.findMany({
        where: {
            familyMembers: { not: null },
        },
    })

    console.log(`找到 ${customers.length} 个客户需要迁移`)

    let successCount = 0
    let errorCount = 0
    let skippedCount = 0

    for (const customer of customers) {
        try {
            const raw = customer.familyMembers
            if (!raw || typeof raw !== 'object') {
                skippedCount++
                continue
            }

            const existingCount = await prisma.familyMember.count({
                where: { customerId: customer.id },
            })

            if (existingCount > 0) {
                console.log(`  跳过客户 ${customer.id}（已有 ${existingCount} 条家庭成员记录）`)
                skippedCount++
                continue
            }

            const members = parseFamilyMembers(raw as LegacyFamilyMembers, customer.id)

            if (members.length === 0) {
                skippedCount++
                continue
            }

            for (const member of members) {
                await prisma.familyMember.create({ data: member })
            }

            successCount++
            console.log(`  ✓ 客户 ${customer.id} 迁移成功，共 ${members.length} 个成员`)
        } catch (error) {
            errorCount++
            console.error(`  ✗ 客户 ${customer.id} 迁移失败:`, error)
        }
    }

    console.log(`\n迁移完成: 成功 ${successCount} 个，跳过 ${skippedCount} 个，失败 ${errorCount} 个`)
}

function parseFamilyMembers(raw: LegacyFamilyMembers, customerId: string) {
    const members: { customerId: string; name: string; relationship: string; isBeneficiary: boolean }[] = []

    if (Array.isArray(raw)) {
        for (const item of raw as unknown as LegacyFamilyMember[]) {
            if (item && typeof item === 'object' && item.name) {
                members.push({
                    customerId,
                    name: item.name,
                    relationship: item.relationship || item.relation || 'Other',
                    isBeneficiary: item.isBeneficiary || item.beneficiary || false,
                })
            }
        }
    } else if (typeof raw === 'object') {
        if (raw.spouse && raw.spouse.name) {
            members.push({
                customerId,
                name: raw.spouse.name,
                relationship: raw.spouse.relation || 'Spouse',
                isBeneficiary: true,
            })
        }

        if (raw.children && Array.isArray(raw.children)) {
            for (const child of raw.children) {
                if (typeof child === 'string') {
                    members.push({
                        customerId,
                        name: child,
                        relationship: 'Child',
                        isBeneficiary: false,
                    })
                } else if (child && typeof child === 'object' && child.name) {
                    members.push({
                        customerId,
                        name: child.name,
                        relationship: child.relationship || child.relation || 'Child',
                        isBeneficiary: child.isBeneficiary || child.beneficiary || false,
                    })
                }
            }
        }

        for (const [key, value] of Object.entries(raw)) {
            if (key === 'spouse' || key === 'children') continue
            if (Array.isArray(value)) {
                for (const item of value) {
                    if (typeof item === 'string') {
                        members.push({
                            customerId,
                            name: item,
                            relationship: key,
                            isBeneficiary: false,
                        })
                    } else if (item && typeof item === 'object' && (item as LegacyFamilyMember).name) {
                        const m = item as LegacyFamilyMember
                        members.push({
                            customerId,
                            name: m.name,
                            relationship: m.relationship || m.relation || key,
                            isBeneficiary: m.isBeneficiary || m.beneficiary || false,
                        })
                    }
                }
            } else if (value && typeof value === 'object' && (value as LegacyFamilyMember).name) {
                const m = value as LegacyFamilyMember
                members.push({
                    customerId,
                    name: m.name,
                    relationship: m.relationship || m.relation || key,
                    isBeneficiary: m.isBeneficiary || m.beneficiary || false,
                })
            }
        }
    }

    return members
}

migrateFamilyMembers()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
