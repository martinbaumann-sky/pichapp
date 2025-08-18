import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

async function ensureCanAccess(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId }, select: { organizerId: true } });
  if (!match) return false;
  if (match.organizerId === userId) return true;
  const spot = await prisma.spot.findFirst({ where: { matchId, userId, status: "PAID" } });
  return !!spot;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");
    if (!matchId) return NextResponse.json({ error: "matchId requerido" }, { status: 400 });
    const ok = await ensureCanAccess(matchId, userId);
    if (!ok) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    const messages = await prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: "asc" },
      take: 300,
    });
    return NextResponse.json({ items: messages }, { status: 200 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Error al listar mensajes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const json = await req.json();
    const matchId = String(json?.matchId || "");
    const text = String(json?.text || "").trim();
    if (!matchId || !text) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const ok = await ensureCanAccess(matchId, userId);
    if (!ok) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    const created = await prisma.message.create({ data: { matchId, senderId: userId, text } });
    return NextResponse.json({ message: created }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 });
  }
}


