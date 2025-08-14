import { prisma } from "../src/lib/db";

async function main() {
  const now = new Date();
  const today18 = new Date(now);
  today18.setHours(18, 0, 0, 0);
  const today20 = new Date(now);
  today20.setHours(20, 0, 0, 0);
  const tomorrow19 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  tomorrow19.setHours(19, 0, 0, 0);

  const samples = [
    { title: "Pichanga Ñuñoa", comuna: "Ñuñoa", startsAt: today18, level: "BEGINNER" },
    { title: "Pichanga Providencia", comuna: "Providencia", startsAt: today20, level: "INTERMEDIATE" },
    { title: "Pichanga Maipú", comuna: "Maipú", startsAt: tomorrow19, level: "ADVANCED" },
    { title: "Pichanga La Florida", comuna: "La Florida", startsAt: tomorrow19, level: "BEGINNER" },
    { title: "Pichanga Santiago Centro", comuna: "Santiago", startsAt: today18, level: "INTERMEDIATE" },
  ] as const;

  for (const s of samples) {
    const match = await prisma.match.create({
      data: {
        title: s.title,
        comuna: s.comuna,
        startsAt: s.startsAt,
        durationMins: 90,
        pricePerSpot: 3000,
        totalSpots: 10,
        level: s.level as any,
        organizer: {
          create: {
            id: crypto.randomUUID(),
            email: null,
            profile: {
              create: { name: "Organizador", phone: "+56 9 1234 5678", comuna: s.comuna },
            },
          },
        },
      },
    });

    const spotsData = Array.from({ length: match.totalSpots }).map(() => ({
      matchId: match.id,
      status: "AVAILABLE" as const,
      priceCLP: match.pricePerSpot,
    }));

    await prisma.spot.createMany({ data: spotsData });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
