import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const docs = await prisma.document.findMany();
    console.log(`Found ${docs.length} documents.`);

    // Ensure dummy file exists
    const dummyDir = path.join(process.cwd(), 'uploads');
    const dummyFile = path.join(dummyDir, 'dummy.pdf');
    if (!fs.existsSync(dummyDir)) {
        fs.mkdirSync(dummyDir, { recursive: true });
    }
    if (!fs.existsSync(dummyFile)) {
        fs.writeFileSync(dummyFile, 'This is a dummy PDF file for local testing.');
    }

    for (const doc of docs) {
        if (!fs.existsSync(doc.filePath) && doc.filePath !== '#') {
            console.log(`Fixing missing file for document ${doc.id}`);
            await prisma.document.update({
                where: { id: doc.id },
                data: { filePath: 'uploads/dummy.pdf' }
            });
        }
    }
    console.log('Done.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
