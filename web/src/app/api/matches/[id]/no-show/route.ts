import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: any) {
  try {
    const organizerId = await requireUserId();
    const matchId = params.id;
    const { spotId } = await req.json();

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return NextResponse.json({ error: "Partido no existe" }, { status: 404 });
    if (match.organizerId !== organizerId) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    await prisma.spot.update({ where: { id: spotId }, data: { status: "NO_SHOW" } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "No se pudo marcar no-show" }, { status: 500 });
  }
}
