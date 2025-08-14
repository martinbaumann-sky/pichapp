import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createMatchSchema, listMatchesSchema } from "@/lib/validator";
import { sampleMatches as sampleMatchesLib } from "@/lib/samples";
import { requireUserId } from "@/lib/auth";
import { streetViewUrl } from "@/lib/places";
import { extractComunaFromText } from "@/lib/places";

export async function POST(req: NextRequest) {
  try {
    const organizerId = await requireUserId();
    const json = await req.json();
    // Rellenar defaults defensivos antes de validar para evitar "Invalid input"
    const derivedComuna = json?.comuna ?? extractComunaFromText(String(json?.venueAddress ?? json?.venueName ?? "")) ?? undefined;
    const safeStartsAt = (() => {
      const raw = json?.startsAt;
      const d = raw ? new Date(raw) : null;
      if (d && !isNaN(d.getTime())) return raw;
      // fallback: mañana 19:00 local
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 19, 0, 0);
      return tomorrow.toISOString();
    })();
    const defensivelyFilled = {
      title: (json?.title?.trim?.() || json?.venueName?.trim?.() || "Partido"),
      venueName: json?.venueName ?? json?.displayAddress ?? "",
      venueAddress: json?.venueAddress ?? json?.displayAddress ?? "",
      startsAt: safeStartsAt,
      level: ["BEGINNER","INTERMEDIATE","ADVANCED"].includes(json?.level) ? json.level : "INTERMEDIATE",
      ...(derivedComuna ? { comuna: derivedComuna } : {}),
      ...json,
      pricePerSpot: Number(json?.pricePerSpot ?? 0),
      totalSpots: Number(json?.totalSpots ?? 0),
      durationMins: Number(json?.durationMins ?? 0),
      occupiedSpots: Number(json?.occupiedSpots ?? 0),
    };
    const parsed = createMatchSchema.safeParse(defensivelyFilled);
    if (!parsed.success) {
      console.error("[POST /api/matches] validation error", {
        issues: parsed.error.issues,
        flatten: parsed.error.flatten(),
        received: defensivelyFilled,
      });
      return NextResponse.json(
        { error: "Datos inválidos", message: parsed.error.issues[0]?.message ?? "Validación fallida", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data as any;

    // Generar coverImageUrl con Google Places/Street View si hay lat/lng
    let coverImageUrl = data.coverImageUrl as string | undefined;
    if (!coverImageUrl && typeof data.lat === "number" && typeof data.lng === "number") {
      // Intentar usar Street View primero
      const svUrl = streetViewUrl(data.lat, data.lng);
      if (svUrl && /^https?:\/\//i.test(svUrl)) {
        coverImageUrl = svUrl;
      }
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
          comuna: comuna,
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
        for (const s of spots) {
          // No asignar userId para evitar violar la restricción única (matchId,userId)
          await tx.spot.update({ where: { id: s.id }, data: { status: "PAID", userId: null } });
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
    console.error("[POST /api/matches] unhandled error", err);
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

    const items = (matches ?? []).map((m: any) => {
      const paid = m.spots.filter((s: any) => s.status === "PAID").length;
      const available = m.spots.filter((s: any) => s.status === "AVAILABLE").length;
      
      // Generar imagen si no existe pero hay coordenadas
      let coverImageUrl = m.coverImageUrl;
      if (!coverImageUrl && m.lat && m.lng) {
        coverImageUrl = streetViewUrl(m.lat, m.lng);
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
        venueName: m.venueName ?? null,
      };
    });

    return new NextResponse(JSON.stringify({ items }), { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json({ error: "Error al listar partidos" }, { status: 500 });
  }
}

// old sample generator removed
