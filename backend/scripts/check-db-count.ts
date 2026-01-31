
import { prisma } from '../src/config/index.js';

async function checkCounts() {
    try {
        const faqCount = await prisma.faqItem.count();
        const catCount = await prisma.faqCategory.count();
        console.log(`FAQ Items: ${faqCount}`);
        console.log(`FAQ Categories: ${catCount}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkCounts();
