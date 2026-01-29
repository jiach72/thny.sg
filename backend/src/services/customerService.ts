import { prisma } from '../config/index.js'

export const customerService = {
    // 获取客户列表（简略版，用于下拉选择）
    async getConnectList(search?: string) {
        return prisma.customer.findMany({
            where: search ? {
                OR: [
                    { companyInfo: { path: ['name'], string_contains: search } }, // Prisma JSON filter might be tricky, fallback to filtering leads
                    { lead: { contactName: { contains: search, mode: 'insensitive' } } },
                    { lead: { companyName: { contains: search, mode: 'insensitive' } } }
                ]
            } : undefined,
            select: {
                id: true,
                lead: {
                    select: {
                        contactName: true,
                        companyName: true,
                        email: true
                    }
                },
                companyInfo: true
            },
            take: 50
        })
    }
}
