import { prisma } from "../src/lib/db";

async function main() {
  console.log("Resetting data...");
  await prisma.payment.deleteMany({});
  await prisma.waitlistEntry.deleteMany({});
  await prisma.spot.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.field.deleteMany({});
  await prisma.venue.deleteMany({});

  // Optional: keep profiles
  // await prisma.profile.deleteMany({});

  // Ensure demo organizer exists
  let organizer = await prisma.user.findFirst({ where: { email: "organizer@demo.cl" } });
  if (!organizer) {
    organizer = await prisma.user.create({ data: { id: crypto.randomUUID(), email: "organizer@demo.cl" } });
    await prisma.profile.create({
      data: {
        userId: organizer.id,
        name: "Demo Organizer",
        phone: "+56 9 1111 1111",
        comuna: "Ñuñoa",
        position: null,
      }
    });
  }

  const base = [
    {
      title: "Miércoles Nocturna",
      comuna: "Ñuñoa",
      startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      durationMins: 90,
      pricePerSpot: 3000,
      totalSpots: 12,
      level: "INTERMEDIATE" as const,
      venueName: "Club Los Maitenes",
      venueAddress: "Av. Irarrázaval 1234, Ñuñoa",
      lat: -33.45694,
      lng: -70.64827,
      coverImageUrl: null as string | null,
      occupiedSpots: 3,
    },
  ];
  while (base.length < 12) {
    base.push({
      title: `Pichanga ${base.length + 1}`,
      comuna: "Providencia",
      startsAt: new Date(Date.now() + (2 + base.length) * 60 * 60 * 1000),
      durationMins: 90,
      pricePerSpot: 3000 + (base.length % 4) * 500,
      totalSpots: 10 + (base.length % 3) * 2,
      level: ["BEGINNER", "INTERMEDIATE", "ADVANCED"][base.length % 3] as any,
      venueName: "Complejo Deportivo",
      venueAddress: "Av. Providencia 1000, Providencia",
      lat: -33.43,
      lng: -70.61,
      coverImageUrl: null,
      occupiedSpots: base.length % 5,
    });
  }

  console.log("Seeding matches...");
  for (const m of base) {
    const match = await prisma.match.create({
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
        coverImageUrl: m.coverImageUrl,
      }
    });
    const spots = await prisma.spot.createMany({
      data: Array.from({ length: m.totalSpots }).map(() => ({
        id: crypto.randomUUID(),
        matchId: match.id,
        status: "AVAILABLE",
        priceCLP: m.pricePerSpot,
      })),
    });
    if (m.occupiedSpots > 0) {
      const first = await prisma.spot.findMany({ where: { matchId: match.id }, take: m.occupiedSpots, orderBy: { createdAt: "asc" } });
      for (const s of first) {
        await prisma.spot.update({ where: { id: s.id }, data: { status: "PAID", userId: null } });
      }
    }
  }
  console.log("Done");
}

main().then(()=>process.exit(0)).catch((e)=>{ console.error(e); process.exit(1); });


