const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);');
  console.log('emailVerifiedAt column ensured');
}

main()
  .catch((err) => {
    console.error('Failed to ensure column', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
