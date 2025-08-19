import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sampleMatches } from "@/lib/samples";
import { streetViewUrl, searchPlace } from "@/lib/places";
import { staticMapUrl } from "@/lib/maps";

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

      // Ensure we have coordinates: use stored lat/lng or attempt geocoding
      let lat: number | null = typeof (match as any).lat === "number" ? (match as any).lat : null;
      let lng: number | null = typeof (match as any).lng === "number" ? (match as any).lng : null;
      if ((lat == null || lng == null) && (match.venueAddress || (match as any).venueName || match.title)) {
        try {
          const q = `${match.venueAddress ?? ""} ${((match as any).venueName ?? match.title ?? "").trim()}`.trim();
          if (q.length > 0) {
            const places = await searchPlace(q);
            if (places && places.length > 0) {
              lat = places[0].lat;
              lng = places[0].lng;
            }
          }
        } catch (err) {
          // ignore
        }
      }

      // Prepare cover image if not present
      let coverImageUrl = (match as any).coverImageUrl ?? null;
      if (!coverImageUrl && lat != null && lng != null) {
        const sv = streetViewUrl(lat, lng);
        if (sv && /^https?:\/\//i.test(sv)) {
          coverImageUrl = sv;
        } else {
          const sm = staticMapUrl({ lat, lng, width: 1200, height: 600, pixelRatio: 2 });
          coverImageUrl = sm ?? `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=17&size=1200x600&markers=${lat},${lng},red`;
        }
      }

      return NextResponse.json({
        id: match.id,
        title: match.title,
        comuna: match.comuna,
        startsAt: match.startsAt,
        level: match.level,
        pricePerSpot: match.pricePerSpot,
        totalSpots: match.totalSpots,
        organizerId: match.organizerId,
        paid,
        available,
        coverImageUrl: coverImageUrl ?? null,
        venueName: (match as any).venueName ?? null,
        organizer: match.organizer?.profile ?? null,
        players: match.spots
          .filter((s: any) => s.status === "PAID" || s.status === "RESERVED")
          .map((s: any) => ({ status: s.status, user: s.user?.profile ?? null })),
        lat: typeof lat === "number" ? lat : null,
        lng: typeof lng === "number" ? lng : null,
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
