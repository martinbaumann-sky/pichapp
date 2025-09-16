import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

export async function GET() {
  try {
    const organizerId = await requireUserId();
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [nextMatch, recentMatches] = await Promise.all([
      prisma.match.findFirst({
        where: { organizerId, startsAt: { gt: now }, public: true },
        orderBy: { startsAt: "asc" },
        include: { spots: { select: { status: true } } },
      }),
      prisma.match.findMany({
        where: { organizerId, startsAt: { gte: ninetyDaysAgo, lte: now } },
        include: { spots: { select: { status: true, priceCLP: true } } },
      }),
    ]);

    const totalOrganized = recentMatches.length;
    let totalSpots = 0;
    let totalPaid = 0;
    for (const m of recentMatches) {
      const paidCount = m.spots.filter((s: any) => s.status === "PAID").length;
      totalSpots += m.totalSpots;
      totalPaid += paidCount;
    }
    const occupancy = totalSpots > 0 ? totalPaid / totalSpots : 0;

    // obtener rating del perfil si existe
    const profile = await prisma.profile.findUnique({ where: { userId: organizerId } });

    const response = {
      nextMatch: nextMatch
        ? {
            id: nextMatch.id,
            title: nextMatch.title,
            comuna: nextMatch.comuna,
            startsAt: nextMatch.startsAt,
            totalSpots: nextMatch.totalSpots,
            paid: nextMatch.spots.filter((s: any) => s.status === "PAID").length,
          }
        : null,
      metrics: {
        totalOrganized,
        occupancy,
        confirmedPlayers: totalPaid,
        rating: profile?.rating ?? 0,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "No autorizado o error de servidor" }, { status: 500 });
  }
}


