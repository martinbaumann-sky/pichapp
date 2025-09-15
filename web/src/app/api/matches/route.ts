import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs';
import { prisma } from "@/lib/db";
import { createMatchSchema, listMatchesSchema } from "@/lib/validator";
import { requireUserId } from "@/lib/auth";
import { streetViewUrl, searchPlace, extractComunaFromText } from "@/lib/places";
import { buildStaticMapUrl } from "@/lib/maps";

export async function POST(req: NextRequest) {
  try {
    const organizerId = await requireUserId();
    const json = await req.json().catch(() => ({}));

    // Defaults defensivos para evitar "invalid input"
    const derivedComuna = json?.comuna ?? extractComunaFromText(String(json?.venueAddress ?? json?.venueName ?? "")) ?? undefined;
    const safeStartsAt = (() => {
      const raw = json?.startsAt;
      const d = raw ? new Date(raw) : null;
      if (d && !isNaN(d.getTime())) return raw;
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 19, 0, 0);
      return tomorrow.toISOString();
    })();

    // Sanitizar jugadores ocupados del organizador
    const allowedPositions = new Set(["ARQUERO", "DEFENSA", "LATERAL", "VOLANTE", "DELANTERO"]);
    const rawPlayers = Array.isArray(json?.occupiedPlayers) ? json.occupiedPlayers : [];
    const sanitizedPlayers = rawPlayers
      .filter((p: any) => p && typeof p === 'object' && String(p.name || '').trim().length > 0)
      .map((p: any) => {
        const pos = String(p.position || '').trim().toUpperCase();
        return {
          name: String(p.name).trim(),
          phone: p.phone ? String(p.phone).trim() : undefined,
          email: p.email ? String(p.email).trim() : undefined,
          position: allowedPositions.has(pos) ? pos : undefined,
          team: p.team ? String(p.team).trim() : undefined,
        };
      });

    const defensivelyFilled = {
      ...json,
      title: (json?.title?.trim?.() || json?.venueName?.trim?.() || "Partido"),
      venueName: json?.venueName ?? json?.displayAddress ?? "",
      venueAddress: json?.venueAddress ?? json?.displayAddress ?? "",
      startsAt: safeStartsAt,
      level: ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(json?.level) ? json.level : "INTERMEDIATE",
      ...(derivedComuna && (!json?.comuna || String(json.comuna).trim().length < 2) ? { comuna: derivedComuna } : {}),
      pricePerSpot: Number(json?.pricePerSpot ?? 0),
      totalSpots: Number(json?.totalSpots ?? 0),
      durationMins: Number(json?.durationMins ?? 0),
      occupiedSpots: Number(json?.occupiedSpots ?? 0),
      ...(sanitizedPlayers.length > 0 ? { occupiedPlayers: sanitizedPlayers } : {}),
    } as any;

    const parsed = createMatchSchema.safeParse(defensivelyFilled);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", message: parsed.error.issues[0]?.message ?? "Validación fallida", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data as any;

    // Generar coverImageUrl: Street View (si hay KEY) > OSM estático > Unsplash
    let coverImageUrl = data.coverImageUrl as string | undefined;
    if (!coverImageUrl && typeof data.lat === "number" && typeof data.lng === "number") {
      const svUrl = streetViewUrl(data.lat, data.lng);
      if (svUrl && /^https?:\/\//i.test(svUrl)) coverImageUrl = svUrl;
      else coverImageUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${data.lat},${data.lng}&zoom=17&size=800x400&markers=${data.lat},${data.lng},red`;
    }
    if (!coverImageUrl) {
      try {
        const parts = [data.venueName || data.title || "cancha", data.comuna || "santiago", "soccer field"]
          .filter(Boolean)
          .map((s: any) => String(s).replace(/\s+/g, "+"))
          .join(",");
        coverImageUrl = `https://source.unsplash.com/800x400/?${parts}`;
      } catch {}
    }

    const match = await prisma.$transaction(async (tx: any) => {
      const comuna =
        (data.comuna && String(data.comuna)) ||
        extractComunaFromText(String(data.venueAddress ?? "")) ||
        extractComunaFromText(String(data.venueName ?? "")) ||
        "Santiago";

      const created = await tx.match.create({
        data: {
          title: data.title,
          comuna,
          startsAt: data.startsAt as unknown as Date,
          durationMins: data.durationMins,
          pricePerSpot: data.pricePerSpot,
          totalSpots: data.totalSpots,
          level: data.level as any,
          organizerId,
          public: true,
          status: "PUBLISHED",
          venueName: data.venueName ?? null,
          venueAddress: data.venueAddress ?? null,
          lat: typeof data.lat === "number" ? data.lat : null,
          lng: typeof data.lng === "number" ? data.lng : null,
          coverImageUrl: coverImageUrl ?? null,
        },
      });

      await tx.spot.createMany({
        data: Array.from({ length: data.totalSpots }).map(() => ({
          matchId: created.id,
          status: "AVAILABLE",
          priceCLP: data.pricePerSpot,
        })),
      });

      // Marcar cupos ocupados por el organizador, si se envían
      const occupied = typeof data.occupiedSpots === "number" ? Math.max(0, Math.min(data.occupiedSpots, data.totalSpots)) : 0;
      if (occupied > 0) {
        const spots = await tx.spot.findMany({ where: { matchId: created.id }, orderBy: { createdAt: "asc" }, take: occupied });
        const occupiedPlayers = Array.isArray(data.occupiedPlayers) ? data.occupiedPlayers : [];
        for (let i = 0; i < spots.length; i++) {
          const s = spots[i];
          const player = occupiedPlayers[i];
          if (player) {
            const u = await tx.user.create({
              data: {
                id: crypto.randomUUID(),
                email: null,
                isAdmin: false,
                profile: { create: { name: player.name || `Jugador ${i + 1}`, phone: player.phone ?? "", comuna: comuna || "", position: player.position ?? null } },
              },
              include: { profile: true },
            });
            await tx.spot.update({ where: { id: s.id }, data: { status: "PAID", userId: u.id, team: player.team ?? null, position: player.position ?? null } });
          } else {
            // Crear un jugador placeholder para que siempre haya nombre visible
            const u = await tx.user.create({
              data: {
                id: crypto.randomUUID(),
                email: null,
                isAdmin: false,
                profile: { create: { name: `Jugador ${i + 1}`, phone: "", comuna: comuna || "", position: null } },
              },
              include: { profile: true },
            });
            await tx.spot.update({ where: { id: s.id }, data: { status: "PAID", userId: u.id } });
          }
        }
      }

      // Si todos los cupos están ocupados, marcar FULL
      if (occupied >= data.totalSpots) {
        await tx.match.update({ where: { id: created.id }, data: { status: "FULL" } });
      }

      return created;
    });

    return NextResponse.json({ match }, { status: 201 });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Error al crear partido" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = Object.fromEntries(searchParams.entries());
    const parsed = listMatchesSchema.safeParse(q);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { comuna, from, level, maxPrice } = parsed.data as any;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(24, Math.max(1, Number(searchParams.get("pageSize") ?? "24")));

    const where: any = {
      public: true,
      status: { in: ["PUBLISHED", "FULL"] },
      startsAt: { gte: from ? new Date(from) : new Date() },
      ...(comuna ? { comuna } : {}),
      ...(level ? { level } : {}),
      ...(typeof maxPrice === "number" ? { pricePerSpot: { lte: maxPrice } } : {}),
    };

    const matches = await prisma.match
      .findMany({
        where,
        orderBy: { startsAt: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          comuna: true,
          startsAt: true,
          level: true,
          pricePerSpot: true,
          totalSpots: true,
          coverImageUrl: true,
          venueName: true,
          lat: true,
          lng: true,
          spots: { select: { status: true } },
        },
      })
      .catch(() => null);

    const items = await Promise.all((matches ?? []).map(async (m: any) => {
      const paid = m.spots.filter((s: any) => s.status === "PAID").length;
      const available = m.spots.filter((s: any) => s.status === "AVAILABLE").length;

      // Si no tenemos lat/lng en DB, intentar geocodificar desde venueAddress/venueName
      let lat = typeof m.lat === "number" ? m.lat : null;
      let lng = typeof m.lng === "number" ? m.lng : null;
      if ((lat == null || lng == null) && (m.venueAddress || m.venueName || m.title)) {
        try {
          const query = `${m.venueAddress ?? ""} ${m.venueName ?? m.title ?? ""}`.trim();
          if (query.length > 0) {
            const places = await searchPlace(query);
            if (places && places.length > 0) {
              lat = places[0].lat;
              lng = places[0].lng;
            }
          }
        } catch {}
      }

      // Generar imagen: Street View > Mapbox/OSM static > Unsplash
      let coverImageUrl = m.coverImageUrl as string | null | undefined;
      if (!coverImageUrl && lat != null && lng != null) {
        const sv = streetViewUrl(lat, lng);
        if (sv && /^https?:\/\//i.test(sv)) {
          coverImageUrl = sv;
        } else {
          const sm = buildStaticMapUrl({ lat, lng, width: 800, height: 400, pixelRatio: 1 });
          coverImageUrl = sm || `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=17&size=800x400&markers=${lat},${lng},red`;
        }
      }

      if (!coverImageUrl) {
        try {
          const parts = [(m.venueName ?? m.title ?? "cancha"), (m.comuna ?? "santiago"), "soccer field"]
            .filter(Boolean)
            .map((s: any) => String(s).replace(/\s+/g, "+"))
            .join(",");
          coverImageUrl = `https://source.unsplash.com/800x400/?${parts}`;
        } catch {}
      }

      return {
        id: m.id,
        title: m.title,
        comuna: m.comuna,
        startsAt: m.startsAt,
        level: m.level,
        pricePerSpot: m.pricePerSpot,
        totalSpots: m.totalSpots,
        paid,
        available,
        coverImageUrl: coverImageUrl ?? null,
        lat: typeof lat === "number" ? lat : null,
        lng: typeof lng === "number" ? lng : null,
        venueName: m.venueName ?? null,
      };
    }));

    return new NextResponse(JSON.stringify({ items }), { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json({ error: "Error al listar partidos" }, { status: 500 });
  }
}
