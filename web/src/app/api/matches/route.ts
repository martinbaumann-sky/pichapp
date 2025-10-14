import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { PaymentProvider } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createMatchSchema, listMatchesSchema } from "@/lib/validator";
import { requireUserId } from "@/lib/auth";
import { getSessionUserId } from "@/lib/auth-core";
import { streetViewUrl, searchPlace, extractComunaFromText } from "@/lib/places";
import { buildStaticMapUrl } from "@/lib/maps";
import { normalizeForStorage } from "@/lib/phone";
import { hasModelField } from "@/lib/prismaCompat";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const organizerId = await requireUserId();
    const json = await req.json().catch(() => ({}));

    const organizer = await prisma.user.findUnique({ where: { id: organizerId }, select: { role: true } });
    if (!organizer || (organizer.role !== "VENUE_ADMIN" && organizer.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "Solo las canchas verificadas pueden crear partidos." },
        { status: 403 },
      );
    }

    // Usamos findFirst sin `select` para soportar instalaciones que todavía ejecutan un Prisma Client antiguo sin
    // las columnas nuevas de pago. Los campos ausentes quedarán como undefined y usan los fallback más abajo.
    const venue = await prisma.venue.findFirst({
      where: { ownerId: organizerId },
    });

    // Defaults defensivos para evitar "invalid input"
    const payloadComuna = typeof json?.comuna === "string" ? json.comuna.trim() : "";
    const derivedComuna =
      payloadComuna ||
      extractComunaFromText(String(json?.venueAddress ?? json?.venueName ?? "")) ||
      venue?.comuna ||
      undefined;
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
          email: p.email ? String(p.email).trim().toLowerCase() : undefined,
          position: allowedPositions.has(pos) ? pos : undefined,
          team: p.team ? String(p.team).trim().toUpperCase() : undefined,
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

    const rawPrice = Number(json?.pricePerSpot ?? 0);
    const safePrice = Number.isFinite(rawPrice) && rawPrice >= 0 ? Math.round(rawPrice) : 0;

    const defensivelyFilled = {
      ...json,
      title: (json?.title?.trim?.() || json?.venueName?.trim?.() || "Partido"),
      venueName: json?.venueName ?? json?.displayAddress ?? venue?.name ?? "",
      venueAddress: json?.venueAddress ?? json?.displayAddress ?? venue?.address ?? "",
      startsAt: safeStartsAt,
      level: ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(json?.level) ? json.level : "INTERMEDIATE",
      comuna: derivedComuna ?? "Santiago",
      pricePerSpot: safePrice,
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

    if (safePrice > 0) {
      if (!venue) {
        return NextResponse.json(
          {
            error: "Necesitas registrar tu cancha antes de crear partidos pagados.",
          },
          { status: 400 },
        );
      }

      if (!venue.payoutEmail || !venue.accountHolder) {
        return NextResponse.json(
          {
            error: "Completa los datos de contacto y liquidación de tu cancha antes de publicar partidos pagados.",
          },
          { status: 400 },
        );
      }

      const paymentProvider: PaymentProvider =
        hasModelField(venue, "paymentProvider") && typeof venue.paymentProvider === "string"
          ? (venue.paymentProvider as PaymentProvider)
          : "MP";
      if (paymentProvider === "MP") {
        if (!venue.mpAccessToken) {
          return NextResponse.json(
            {
              error: "Conecta Mercado Pago desde el panel de tu cancha para recibir los pagos directamente.",
            },
            { status: 400 },
          );
        }
        if (!venue.mpCollectorId || !venue.mpAccountType) {
          return NextResponse.json(
            {
              error: "Completa el Collector ID y el tipo de cuenta de Mercado Pago antes de publicar partidos pagados.",
            },
            { status: 400 },
          );
        }
      } else if (paymentProvider === "FLOW") {
        if (!venue.flowApiKey || !venue.flowSecretKey) {
          return NextResponse.json(
            {
              error: "Ingresa las credenciales de Flow en el perfil de la cancha antes de publicar partidos pagados.",
            },
            { status: 400 },
          );
        }
      } else {
        return NextResponse.json(
          {
            error: "El proveedor de cobros configurado en tu cancha no es compatible para publicar partidos pagados.",
          },
          { status: 400 },
        );
      }
    }

    const match = await prisma.$transaction(async (tx: any) => {
      const comuna =
        (data.comuna && String(data.comuna)) ||
        venue?.comuna ||
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
          venueName: data.venueName || venue?.name || null,
          venueAddress: data.venueAddress || venue?.address || null,
          venueId: venue?.id ?? null,
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
            const email = player?.email ? String(player.email).trim().toLowerCase() : null;
            await prisma.$executeRaw`INSERT INTO "public"."User" ("id", "email", "isAdmin", "role") VALUES (${newUserId}, ${email}, ${false}, ${"PLAYER"})`;
            const newProfileId = crypto.randomUUID();
            const name = player?.name ? String(player.name) : `Jugador ${i + 1}`;
            const phone = player?.phone ? normalizeForStorage(player.phone) : null;
            const position = player?.position ? String(player.position) : null;
            await prisma.$executeRaw`INSERT INTO "public"."Profile" ("id", "userId", "name", "phone", "comuna", "position") VALUES (${newProfileId}, ${newUserId}, ${name}, ${phone}, ${match.comuna || ""}, ${position}::"Position")`;
            const team = player?.team ? String(player.team).trim().toUpperCase() : null;
            await prisma.spot.update({ where: { id: spot.id }, data: { status: "PAID", userId: newUserId, team: team, position: position ? (position as any) : undefined } });
            if (email) {
              try {
                await (prisma as any)?.guestInvite?.create?.({
                  data: {
                    matchId: match.id,
                    inviterId: organizerId,
                    spotId: spot.id,
                    guestUserId: newUserId,
                    name,
                    email,
                    position: position ? (position as any) : null,
                  },
                }).catch(() => null);
              } catch {}
            }
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
    const { comuna, from, to, level } = parsed.data as any;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(24, Math.max(1, Number(searchParams.get("pageSize") ?? "24")));

    const now = new Date();
    let effectiveFrom: Date;
    let effectiveTo: Date | null = null;
    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        return NextResponse.json(
          { error: "Fecha inválida", details: "El parámetro 'from' debe ser una fecha ISO válida" },
          { status: 400 }
        );
      }
      effectiveFrom = new Date(Math.max(fromDate.getTime(), now.getTime()));
    } else {
      effectiveFrom = now;
    }

    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        return NextResponse.json(
          { error: "Fecha inválida", details: "El parámetro 'to' debe ser una fecha ISO válida" },
          { status: 400 },
        );
      }
      effectiveTo = toDate <= effectiveFrom ? new Date(effectiveFrom.getTime() + 24 * 60 * 60 * 1000) : toDate;
    }

    const where: any = {
      public: true,
      status: { in: ["PUBLISHED", "FULL"] },
      startsAt: { gte: effectiveFrom, ...(effectiveTo ? { lt: effectiveTo } : {}) },
      ...(comuna ? { comuna } : {}),
      ...(level ? { level } : {}),
    };

    const viewerId = await getSessionUserId().catch(() => null);
    let friendIds = new Set<string>();
    if (viewerId) {
      const friendships = await prisma.friend
        .findMany({
          where: {
            status: "ACCEPTED",
            OR: [
              { requesterId: viewerId },
              { addresseeId: viewerId },
            ],
          },
          select: { requesterId: true, addresseeId: true },
        })
        .catch(() => []);
      friendIds = new Set<string>();
      for (const friend of friendships) {
        if (friend.requesterId && friend.requesterId !== viewerId) {
          friendIds.add(friend.requesterId);
        }
        if (friend.addresseeId && friend.addresseeId !== viewerId) {
          friendIds.add(friend.addresseeId);
        }
      }
    }

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
          spots: { select: { status: true, userId: true, user: { select: { profile: { select: { name: true } } } } } },
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
          spots: { select: { status: true, userId: true, user: { select: { profile: { select: { name: true } } } } } },
        },
      }).catch(() => null);
    }

    // Map DB results into lightweight API items with defensive guards
    const items = await Promise.all((matches ?? []).map(async (m: any) => {
      const paid = m.spots.filter((s: any) => s.status === "PAID").length;
      const available = m.spots.filter((s: any) => s.status === "AVAILABLE").length;
      const friendEntries =
        friendIds.size > 0
          ? m.spots
              .filter((s: any) => s.status === "PAID" && s.userId && friendIds.has(s.userId))
              .map((s: any) => ({
                userId: s.userId,
                name:
                  typeof s.user?.profile?.name === "string" ? (s.user.profile.name as string) : null,
              }))
          : [];
      const friendNames = friendEntries
        .map((entry: any) => {
          const raw = entry.name;
          return typeof raw === "string" ? raw.trim() : "";
        })
        .filter((name: string) => name.length > 0);

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
        friendCount: friendEntries.length,
        friendNames: friendNames.slice(0, 3),
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
