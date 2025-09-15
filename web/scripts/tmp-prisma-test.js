const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const [users, matches, spots] = await Promise.all([
      prisma.user.count(),
      prisma.match.count(),
      prisma.spot.count(),
    ]);
    console.log('Prisma OK. Users =', users, 'Matches =', matches, 'Spots =', spots);
    process.exit(0);
  } catch (e) {
    console.error('Prisma test error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
