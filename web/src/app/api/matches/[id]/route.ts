import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streetViewUrl } from "@/lib/places";
import { buildStaticMapUrl } from "@/lib/maps";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const m = await prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        organizerId: true,
        comuna: true,
        startsAt: true,
        durationMins: true,
        pricePerSpot: true,
        totalSpots: true,
        level: true,
        venueName: true,
        venueAddress: true,
        lat: true,
        lng: true,
        coverImageUrl: true,
        spots: { select: { status: true } },
      },
    });
    if (!m) return NextResponse.json({ error: "not found" }, { status: 404 });

    // counts
    const paid = m.spots.filter((s: any) => s.status === "PAID").length;
    const available = m.spots.filter((s: any) => s.status === "AVAILABLE").length;

    // organizer name
    const profile = await prisma.profile.findUnique({ where: { userId: m.organizerId } }).catch(() => null);

    // cover image fallback
    let cover = m.coverImageUrl as string | null | undefined;
    if (!cover) {
      if (typeof m.lat === "number" && typeof m.lng === "number") {
        const sv = streetViewUrl(m.lat, m.lng);
        cover = sv || buildStaticMapUrl({ lat: m.lat, lng: m.lng, width: 800, height: 400, pixelRatio: 1 }) || null;
      }
    }

    const out = {
      id: m.id,
      title: m.title,
      comuna: m.comuna,
      startsAt: m.startsAt,
      durationMins: m.durationMins,
      pricePerSpot: m.pricePerSpot,
      totalSpots: m.totalSpots,
      level: m.level,
      venueName: m.venueName,
      venueAddress: m.venueAddress,
      lat: m.lat,
      lng: m.lng,
      coverImageUrl: cover ?? null,
      paid,
      available,
      organizer: profile ? { id: m.organizerId, name: profile.name } : null,
    };

    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}

