import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createMarketplacePreference } from "@/lib/mp/marketplace";

function resolveBaseUrl(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const host = req.headers.get("host");
  if (host) {
    const protocol = req.nextUrl.protocol ?? "https:";
    return `${protocol}//${host}`;
  }
  return req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => ({}));
    const canchaId = typeof body?.canchaId === "string" ? body.canchaId : null;
    const partidoId = typeof body?.partidoId === "string" ? body.partidoId : null;
    const reservaId = typeof body?.reservaId === "string" ? body.reservaId : null;

    if (!canchaId || !partidoId || !reservaId) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: partidoId },
      select: { id: true, title: true, pricePerSpot: true, venueId: true },
    });
    if (!match || match.venueId !== canchaId) {
      return NextResponse.json({ error: "Partido o cancha inválidos" }, { status: 404 });
    }

    const spot = await prisma.spot.findUnique({
      where: { id: reservaId },
      select: { id: true, matchId: true, userId: true },
    });
    if (!spot || spot.matchId !== partidoId || spot.userId !== userId) {
      return NextResponse.json({ error: "Reserva inválida" }, { status: 403 });
    }

    const payment = await prisma.payment.findUnique({
      where: { spotId: reservaId },
      select: { id: true, amountCLP: true, status: true },
    });
    if (!payment || payment.status !== "PENDING") {
      return NextResponse.json({ error: "Pago no disponible" }, { status: 400 });
    }

    const baseUrl = resolveBaseUrl(req);
    const preference = await createMarketplacePreference({
      venueId: canchaId,
      title: body?.titulo || match.title || "Cupo PichangApp",
      priceCLP: payment.amountCLP,
      externalReference: `${match.id}:${reservaId}`,
      baseUrl,
      payer: null,
    });

    await prisma.payment.update({ where: { id: payment.id }, data: { providerRef: preference.id } });

    return NextResponse.json({ init_point: preference.initPoint, id: preference.id });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("[mp/create-preference]", err);
    return NextResponse.json({ error: err?.message ?? "No se pudo crear la preferencia" }, { status: 500 });
  }
}
