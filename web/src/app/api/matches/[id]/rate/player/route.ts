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
    const playerId = String(json?.playerId || "");
    const skill = Number(json?.skill ?? NaN);
    const behavior = Number(json?.behavior ?? NaN);
    const teamwork = Number(json?.teamwork ?? NaN);
    if (!playerId || [skill, behavior, teamwork].some((v) => isNaN(v) || v < 0 || v > 10)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return NextResponse.json({ error: "Partido no existe" }, { status: 404 });
    const now = new Date();
    if (match.startsAt > now) return NextResponse.json({ error: "Aún no puedes calificar" }, { status: 400 });
    const deadline = new Date(match.startsAt.getTime() + 72 * 60 * 60 * 1000);
    if (now > deadline) return NextResponse.json({ error: "Ventana de calificación expirada" }, { status: 400 });
    if (match.organizerId !== raterId) return NextResponse.json({ error: "Solo el organizador puede calificar jugadores" }, { status: 403 });
    const playerSpot = await prisma.spot.findFirst({ where: { matchId, userId: playerId, status: "PAID" }, select: { id: true } });
    if (!playerSpot) return NextResponse.json({ error: "Jugador no participó" }, { status: 400 });

    const overall = round1(skill * 0.6 + behavior * 0.2 + teamwork * 0.2);

    const result = await prisma.$transaction(async (tx: any) => {
      const rating = await tx.playerRating.upsert({
        where: { matchId_playerId: { matchId, playerId } },
        update: { raterId, skill, behavior, teamwork, overall },
        create: { matchId, playerId, raterId, skill, behavior, teamwork, overall },
      });
      const agg = await tx.playerRating.aggregate({ where: { playerId }, _avg: { overall: true }, _count: { _all: true } });
      await tx.profile.updateMany({ where: { userId: playerId }, data: { playerRatingAvg: (agg._avg.overall ?? 0) as any, playerRatingCount: agg._count._all } });
      return rating;
    });

    return NextResponse.json({ ok: true, rating: result }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Error al calificar" }, { status: 500 });
  }
}


