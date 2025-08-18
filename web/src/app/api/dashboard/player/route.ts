import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await requireUserId();
    const now = new Date();

    const [nextSpot, playedSpots] = await Promise.all([
      prisma.spot.findFirst({
        where: { userId, status: "PAID", match: { startsAt: { gt: now } } },
        orderBy: { match: { startsAt: "asc" } },
        include: { match: true },
      }),
      prisma.spot.findMany({
        where: { userId, status: "PAID", match: { startsAt: { lt: now } } },
        include: { match: true },
      }),
    ]);

    const response = {
      nextMatch: nextSpot
        ? {
            id: nextSpot.matchId,
            title: nextSpot.match?.title ?? "Partido",
            comuna: nextSpot.match?.comuna ?? "",
            startsAt: nextSpot.match?.startsAt ?? now,
            pricePerSpot: nextSpot.match?.pricePerSpot ?? 0,
          }
        : null,
      metrics: {
        playedCount: playedSpots.length,
        totalSpent: playedSpots.reduce((sum, s) => sum + (s.match?.pricePerSpot ?? 0), 0),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "No autorizado o error de servidor" }, { status: 500 });
  }
}


