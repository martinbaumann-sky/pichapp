import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sampleMatches } from "@/lib/samples";

export async function GET(_req: NextRequest, { params }: any) {
  try {
    const { id } = params as { id: string };

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        organizer: { include: { profile: true } },
        spots: {
          include: { user: { include: { profile: true } } },
        },
      },
    });

    if (match) {
      const paid = match.spots.filter((s: any) => s.status === "PAID").length;
      const available = match.spots.filter((s: any) => s.status === "AVAILABLE").length;
      return NextResponse.json({
        id: match.id,
        title: match.title,
        comuna: match.comuna,
        startsAt: match.startsAt,
        level: match.level,
        pricePerSpot: match.pricePerSpot,
        totalSpots: match.totalSpots,
        paid,
        available,
        coverImageUrl: (match as any).coverImageUrl ?? null,
        venueName: (match as any).venueName ?? null,
        organizer: match.organizer?.profile ?? null,
        players: match.spots
          .filter((s: any) => s.status === "PAID" || s.status === "RESERVED")
          .map((s: any) => ({ status: s.status, user: s.user?.profile ?? null })),
      });
    }

    const fallback = sampleMatches().find((m: any) => m.id === id);
    if (!fallback) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    const paid = fallback.spots.filter((s: any) => s.status === "PAID").length;
    const available = fallback.spots.filter((s: any) => s.status === "AVAILABLE").length;

    return NextResponse.json({
      id: fallback.id,
      title: fallback.title,
      comuna: fallback.comuna,
      startsAt: fallback.startsAt,
      level: fallback.level,
      pricePerSpot: fallback.pricePerSpot,
      totalSpots: fallback.totalSpots,
      paid,
      available,
    });
  } catch (err) {
    return NextResponse.json({ error: "Error al obtener partido" }, { status: 500 });
  }
}
