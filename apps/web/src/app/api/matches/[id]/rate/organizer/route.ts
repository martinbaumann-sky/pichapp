import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

export const dynamic = 'force-dynamic';

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export async function POST(req: NextRequest, ctx: { params: { id: string } } | { params: Promise<{ id: string }> }) {
  try {
    const raterId = await requireUserId();
    const p: any = (ctx as any)?.params;
    const { id: matchId } = (p && typeof p.then === 'function') ? await p : p;
    const json = await req.json();
    const comms = Number(json?.comms ?? NaN);
    const punctual = Number(json?.punctual ?? NaN);
    const fairness = Number(json?.fairness ?? NaN);
    if ([comms, punctual, fairness].some((v) => isNaN(v) || v < 0 || v > 10)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return NextResponse.json({ error: "Partido no existe" }, { status: 404 });
    const now = new Date();
    if (match.startsAt > now) return NextResponse.json({ error: "Aún no puedes calificar" }, { status: 400 });
    const deadline = new Date(match.startsAt.getTime() + 72 * 60 * 60 * 1000);
    if (now > deadline) return NextResponse.json({ error: "Ventana de calificación expirada" }, { status: 400 });
    const participated = await prisma.spot.findFirst({ where: { matchId, userId: raterId, status: "PAID" }, select: { id: true } });
    if (!participated) return NextResponse.json({ error: "No participaste en este partido" }, { status: 403 });

    const organizerId = match.organizerId;
    const overall = round1(comms * 0.4 + punctual * 0.3 + fairness * 0.3);

    const result = await prisma.$transaction(async (tx: any) => {
      const rating = await tx.organizerRating.upsert({
        where: { matchId_raterId: { matchId, raterId } },
        update: { organizerId, comms, punctual, fairness, overall },
        create: { matchId, raterId, organizerId, comms, punctual, fairness, overall },
      });
      const agg = await tx.organizerRating.aggregate({ where: { organizerId }, _avg: { overall: true }, _count: { _all: true } });
      await tx.profile.updateMany({ where: { userId: organizerId }, data: { organizerRatingAvg: (agg._avg.overall ?? 0) as any, organizerRatingCount: agg._count._all } });
      return rating;
    });

    return NextResponse.json({ ok: true, rating: result }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Error al calificar" }, { status: 500 });
  }
}


