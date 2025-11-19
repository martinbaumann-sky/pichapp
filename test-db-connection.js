const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dotenv = require('dotenv');

// Load env from apps/web/.env explicitly
const envPath = path.resolve(__dirname, 'apps/web/.env');
console.log(`Loading env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env:', result.error);
} else {
    console.log('.env loaded successfully.');
}

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found (hidden)' : 'Not Found');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('Connection successful!');

        const userCount = await prisma.user.count();
        console.log(`User count: ${userCount}`);

    } catch (e) {
        console.error('Connection failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
