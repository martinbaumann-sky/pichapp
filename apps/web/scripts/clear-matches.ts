import { prisma } from "../src/lib/db";

async function main() {
  console.log("Deleting all matches and related data...");
  await prisma.payment.deleteMany({});
  await prisma.waitlistEntry.deleteMany({});
  await prisma.spot.deleteMany({});
  await prisma.match.deleteMany({});
  console.log("Done");
}

main().then(()=>process.exit(0)).catch((e)=>{ console.error(e); process.exit(1); });


