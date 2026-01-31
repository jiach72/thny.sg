
import { prisma } from '../src/config/index.js';

async function resetFaqData() {
    console.log('⚠️  Starting FAQ Database Reset (Items & Categories)...');
    try {
        // 1. Delete all FAQ items first (foreign key constraint: items depend on categories)
        const deletedItems = await prisma.faqItem.deleteMany({});
        console.log(`✅ Deleted ${deletedItems.count} FAQ items.`);

        // 2. Delete all FAQ categories
        const deletedCategories = await prisma.faqCategory.deleteMany({});
        console.log(`✅ Deleted ${deletedCategories.count} FAQ categories.`);

        console.log('🎉 FAQ database reset successfully.');

    } catch (error) {
        console.error('❌ Error resetting FAQ data:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

resetFaqData();
