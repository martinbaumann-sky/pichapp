import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await requireUserId();
    const now = new Date();

    const spots = await prisma.spot.findMany({
      where: {
        userId,
        status: "PAID",
      },
      include: {
        match: {
          select: {
            id: true,
            title: true,
            comuna: true,
            startsAt: true,
            venueName: true,
          },
        },
      },
      orderBy: { match: { startsAt: "desc" } },
      take: 80,
    });

    const byMatchId = new Map<string, any>();
    for (const spot of spots) {
      if (!spot.match) continue;
      if (!byMatchId.has(spot.match.id)) {
        byMatchId.set(spot.match.id, {
          id: spot.match.id,
          title: spot.match.title,
          comuna: spot.match.comuna,
          startsAt: spot.match.startsAt,
          venueName: spot.match.venueName,
          upcoming: spot.match.startsAt > now,
        });
      }
    }

    const matches = Array.from(byMatchId.values()).sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

    return NextResponse.json({ matches });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[messages/inbox]", error);
    return NextResponse.json({ error: "No pudimos cargar tus conversaciones" }, { status: 500 });
  }
}
