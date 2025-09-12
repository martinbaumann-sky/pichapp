import { prisma } from "../src/lib/db";

async function main() {
  console.log("Clearing existing matches (and related data)...");
  await prisma.payment.deleteMany({});
  await prisma.waitlistEntry.deleteMany({});
  await prisma.spot.deleteMany({});
  await prisma.match.deleteMany({});

  let organizer = await prisma.user.findFirst({ where: { email: "organizer@demo.cl" }, select: { id: true, email: true } });
  if (!organizer) {
    organizer = await prisma.user.create({ data: { id: crypto.randomUUID(), email: "organizer@demo.cl" }, select: { id: true, email: true } });
    await prisma.profile.create({
      data: { userId: organizer.id, name: "Demo Organizer", phone: "+56 9 1111 1111", comuna: "Nunoa" },
    });
  }

  const now = new Date();
  const thursday20 = new Date(now);
  thursday20.setDate(now.getDate() + ((4 - now.getDay() + 7) % 7 || 7)); // next Thursday
  thursday20.setHours(20, 0, 0, 0);

  const saturday17 = new Date(now);
  saturday17.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7 || 7)); // next Saturday
  saturday17.setHours(17, 0, 0, 0);

  const examples = [
    {
      title: "Jueves nocturna - Club Los Maitenes",
      comuna: "Nunoa",
      startsAt: thursday20,
      durationMins: 90,
      pricePerSpot: 3000,
      totalSpots: 12,
      level: "INTERMEDIATE" as const,
      venueName: "Club Los Maitenes",
      venueAddress: "Av. Irarrazaval 1234, Nunoa",
      lat: -33.45694,
      lng: -70.64827,
      occupied: 3,
    },
    {
      title: "Sabado tarde - Estadio Manuel Plaza",
      comuna: "Santiago",
      startsAt: saturday17,
      durationMins: 90,
      pricePerSpot: 3000,
      totalSpots: 14,
      level: "BEGINNER" as const,
      venueName: "Estadio Manuel Plaza",
      venueAddress: "Av. Salvador 80, Providencia",
      lat: -33.4405,
      lng: -70.6217,
      occupied: 2,
    },
  ];

  console.log("Seeding example matches...");
  for (const m of examples) {
    const created = await prisma.match.create({
      data: {
        id: crypto.randomUUID(),
        title: m.title,
        organizerId: organizer.id,
        comuna: m.comuna,
        startsAt: m.startsAt,
        durationMins: m.durationMins,
        pricePerSpot: m.pricePerSpot,
        totalSpots: m.totalSpots,
        level: m.level as any,
        status: "PUBLISHED",
        public: true,
        venueName: m.venueName,
        venueAddress: m.venueAddress,
        lat: m.lat,
        lng: m.lng,
      },
    });
    await prisma.spot.createMany({
      data: Array.from({ length: m.totalSpots }).map(() => ({
        id: crypto.randomUUID(),
        matchId: created.id,
        status: "AVAILABLE",
        priceCLP: m.pricePerSpot,
      })),
    });
    if (m.occupied > 0) {
      const first = await prisma.spot.findMany({ where: { matchId: created.id }, select: { id: true }, orderBy: { createdAt: "asc" }, take: m.occupied });
      for (const s of first) {
        await prisma.spot.update({ where: { id: s.id }, data: { status: "PAID" }, select: { id: true } });
      }
    }
  }
  console.log("Done.");
}

main().then(()=>process.exit(0)).catch((e)=>{ console.error(e); process.exit(1); });
