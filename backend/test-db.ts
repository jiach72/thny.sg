import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const articles = await prisma.newsArticle.findMany({
        take: 2,
        where: { source: 'rss' },
        orderBy: { createdAt: 'desc' },
        select: { title: true, content: true, summary: true, sourceUrl: true }
    })
    console.log(JSON.stringify(articles, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
