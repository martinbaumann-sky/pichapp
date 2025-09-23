import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { createMatchSchema, listMatchesSchema } from "@/lib/validator";
import { requireUserId } from "@/lib/auth";
import { streetViewUrl, searchPlace, extractComunaFromText } from "@/lib/places";
import { buildStaticMapUrl } from "@/lib/maps";
import { normalizeForStorage } from "@/lib/phone";

export const runtime = 'nodejs';

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
        const normalizedPhone = typeof p.phone === 'string' ? normalizeForStorage(p.phone) : null;
        return {
          name: String(p.name).trim(),
          phone: normalizedPhone ?? undefined,
          email: p.email ? String(p.email).trim() : undefined,
          position: allowedPositions.has(pos) ? pos : undefined,
          team: p.team ? String(p.team).trim() : undefined,
        };
      });

    const totalSpotsNumber = Number(json?.totalSpots ?? 0);
    const derivedMinSpots = (() => {
      const raw = Number(json?.minSpotsToConfirm ?? 0);
      if (Number.isFinite(raw) && raw > 0) return raw;
      if (Number.isFinite(totalSpotsNumber) && totalSpotsNumber > 0) {
        return Math.max(1, Math.min(Math.ceil(totalSpotsNumber * 0.6), totalSpotsNumber));
      }
      return 1;
    })();
    const safeMinSpots = Number.isFinite(totalSpotsNumber) && totalSpotsNumber > 0
      ? Math.max(1, Math.min(derivedMinSpots, totalSpotsNumber))
      : Math.max(1, derivedMinSpots);

    const defensivelyFilled = {
      ...json,
      title: (json?.title?.trim?.() || json?.venueName?.trim?.() || "Partido"),
      venueName: json?.venueName ?? json?.displayAddress ?? "",
      venueAddress: json?.venueAddress ?? json?.displayAddress ?? "",
      startsAt: safeStartsAt,
      level: ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(json?.level) ? json.level : "INTERMEDIATE",
      ...(derivedComuna && (!json?.comuna || String(json.comuna).trim().length < 2) ? { comuna: derivedComuna } : {}),
      pricePerSpot: 0,
      totalSpots: totalSpotsNumber,
      minSpotsToConfirm: safeMinSpots,
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
          minSpotsToConfirm: data.minSpotsToConfirm,
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


      return created;
    });
    // Intento best-effort de guardar minSpotsToConfirm fuera de la transacción
    try {
      await prisma.$executeRaw`UPDATE "Match" SET "minSpotsToConfirm" = ${data.minSpotsToConfirm} WHERE "id" = ${match.id}`;
    } catch {}

    // Procesar cupos ocupados por el organizador fuera de la transacción
    try {
      const occupied = typeof data.occupiedSpots === "number" ? Math.max(0, Math.min(data.occupiedSpots, data.totalSpots)) : 0;
      if (occupied > 0) {
        const spots = await prisma.spot.findMany({ where: { matchId: match.id }, orderBy: { createdAt: "asc" }, take: occupied });
        const occupiedPlayers = Array.isArray(data.occupiedPlayers) ? data.occupiedPlayers : [];
        for (let i = 0; i < spots.length; i++) {
          const spot = spots[i];
          const player = occupiedPlayers[i];
          try {
            const newUserId = crypto.randomUUID();
            await prisma.$executeRaw`INSERT INTO "public"."User" ("id", "email", "isAdmin") VALUES (${newUserId}, ${null}, ${false})`;
            const newProfileId = crypto.randomUUID();
            const name = player?.name ? String(player.name) : `Jugador ${i + 1}`;
            const phone = player?.phone ? normalizeForStorage(player.phone) : null;
            const position = player?.position ? String(player.position) : null;
            await prisma.$executeRaw`INSERT INTO "public"."Profile" ("id", "userId", "name", "phone", "comuna", "position") VALUES (${newProfileId}, ${newUserId}, ${name}, ${phone}, ${match.comuna || ""}, ${position}::"Position")`;
            await prisma.spot.update({ where: { id: spot.id }, data: { status: "PAID", userId: newUserId, team: player?.team ?? null, position } });
          } catch {
            // ignorar fallos individuales
          }
        }
        if (occupied >= data.totalSpots) {
          await prisma.match.update({ where: { id: match.id }, data: { status: "FULL" } }).catch(() => null);
        }
      }
    } catch {
      // ignorar errores best-effort
    }

    return NextResponse.json({ match }, { status: 201 });
  } catch (err: any) {
    // Loguear error completo para depuración local
    // No mostramos stack en producción, pero sí el mensaje.
    // eslint-disable-next-line no-console
    console.error("/api/matches POST error:", err);
    if (err instanceof Response) return err;
    const payload: any = { error: err?.message || "Error al crear partido" };
    if (process.env.NODE_ENV !== "production") {
      payload.details = err?.stack || String(err);
    }
    return NextResponse.json(payload, { status: 500 });
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
    const { comuna, from, level } = parsed.data as any;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(24, Math.max(1, Number(searchParams.get("pageSize") ?? "24")));

    const where: any = {
      public: true,
      status: { in: ["PUBLISHED", "FULL"] },
      startsAt: { gte: from ? new Date(from) : new Date() },
      ...(comuna ? { comuna } : {}),
      ...(level ? { level } : {}),
    };

    let matches: any[] | null = null;
    try {
      matches = await prisma.match.findMany({
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
          minSpotsToConfirm: true,
          coverImageUrl: true,
          venueName: true,
          venueAddress: true,
          lat: true,
          lng: true,
          spots: { select: { status: true } },
        },
      });
    } catch {
      matches = await prisma.match.findMany({
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
          venueAddress: true,
          lat: true,
          lng: true,
          spots: { select: { status: true } },
        },
      }).catch(() => null);
    }

    // Map DB results into lightweight API items with defensive guards
    const items = await Promise.all((matches ?? []).map(async (m: any) => {
      const paid = m.spots.filter((s: any) => s.status === "PAID").length;
      const available = m.spots.filter((s: any) => s.status === "AVAILABLE").length;

      // Si no tenemos lat/lng en DB, intentar geocodificar desde venueAddress/venueName (con fail-safe)
      let lat = typeof m.lat === "number" ? m.lat : null;
      let lng = typeof m.lng === "number" ? m.lng : null;
      if ((lat == null || lng == null) && (m.venueAddress || m.venueName || m.title)) {
        try {
          const query = `${m.venueAddress ?? ""} ${m.venueName ?? m.title ?? ""}`.trim();
          if (query.length > 0) {
            const places = await searchPlace(query).catch(() => [] as any[]);
            if (places && places.length > 0) {
              lat = places[0].lat;
              lng = places[0].lng;
            }
          }
        } catch {
          // ignorar errores de geocodificación
        }
      }

      // Generar imagen: Street View > Mapbox/OSM static > Unsplash (con fail-safe)
      let coverImageUrl = m.coverImageUrl as string | null | undefined;
      try {
        if (!coverImageUrl && lat != null && lng != null) {
          const sv = streetViewUrl(lat, lng);
          if (sv && /^https?:\/\//i.test(sv)) {
            coverImageUrl = sv;
          } else {
            const sm = buildStaticMapUrl({ lat, lng, width: 800, height: 400, pixelRatio: 1 });
            coverImageUrl = sm || `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=17&size=800x400&markers=${lat},${lng},red`;
          }
        }
      } catch {
        // ignorar fallos al construir URL de imagen
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

      const rawMinSpots = (m as any).minSpotsToConfirm;
      const minRequired = typeof rawMinSpots === 'number' && rawMinSpots > 0 ? rawMinSpots : m.totalSpots;

      return {
        id: m.id,
        title: m.title,
        comuna: m.comuna,
        startsAt: m.startsAt,
        level: m.level,
        pricePerSpot: m.pricePerSpot,
        totalSpots: m.totalSpots,
        minSpotsToConfirm: minRequired,
        confirmed: paid >= minRequired,
        paid,
        available,
        coverImageUrl: coverImageUrl ?? null,
        lat: typeof lat === "number" ? lat : null,
        lng: typeof lng === "number" ? lng : null,
        venueName: m.venueName ?? null,
        venueAddress: m.venueAddress ?? null,
      };
    }));

    return new NextResponse(JSON.stringify({ items }), { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("/api/matches GET error:", err);
    return NextResponse.json({ error: "Error al listar partidos" }, { status: 500 });
  }
}
