
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const match = await prisma.match.findUnique({
            where: { id: 'f7d6446a-1a9a-482e-b5e8-42e16a0bb18c' },
            include: { venue: true }
        });
        const v = match?.venue;
        if (v) {
            console.log('payoutEmail:', v.payoutEmail);
            console.log('accountHolder:', v.accountHolder);
            console.log('mpAccessToken:', v.mpAccessToken ? 'YES' : 'NO');
            console.log('mpCollectorId:', v.mpCollectorId);
            console.log('mpAccountType:', v.mpAccountType);
            console.log('paymentProvider:', v.paymentProvider);
        } else {
            console.log('Venue not found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
