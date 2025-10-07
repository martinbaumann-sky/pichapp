import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

async function ensureCanAccess(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId }, select: { organizerId: true } });
  if (!match) return false;
  if (match.organizerId === userId) return true;
  const spot = await prisma.spot.findFirst({
    where: {
      matchId,
      userId,
      status: "PAID",
    },
  });
  return !!spot;
}

export async function GET(req: NextRequest) {
  // Stepwise handling to get clearer error info
  try {
    let userId: string;
    try {
      userId = await requireUserId();
    } catch (e) {
      if (e instanceof Response) return e;
      console.error("[API] GET /api/messages auth error:", e);
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");
    if (!matchId) return NextResponse.json({ error: "matchId requerido" }, { status: 400 });

    let ok = false;
    try {
      ok = await ensureCanAccess(matchId, userId);
    } catch (e) {
      console.error("[API] GET /api/messages ensureCanAccess error:", e);
      return NextResponse.json({ error: "Error verificando acceso" }, { status: 500 });
    }
    if (!ok) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    let messages: any[] = [];
    try {
      messages = await prisma.message.findMany({ where: { matchId }, orderBy: { createdAt: "asc" }, take: 300 });
    } catch (e) {
      console.error("[API] GET /api/messages prisma.findMany error:", e);
      // En vez de devolver 500 que borra el estado del cliente, devolvemos 200 con items vacíos
      // y un campo de error para depuración en cliente.
      return NextResponse.json({ items: [], error: "Error leyendo mensajes desde la base de datos" }, { status: 200 });
    }

    // Obtener perfiles de los remitentes en batch
    const senderIds = Array.from(new Set(messages.map((m: any) => m.senderId).filter(Boolean)));
    let profiles: any[] = [];
    try {
      profiles = senderIds.length > 0 ? await prisma.profile.findMany({ where: { userId: { in: senderIds } } }) : [];
    } catch (e) {
      console.error("[API] GET /api/messages prisma.profile.findMany error:", e);
      profiles = [];
    }

    const profileByUserId: Record<string, any> = {};
    for (const p of profiles) profileByUserId[p.userId] = p;

    const items = messages.map((m: any) => ({
      ...m,
      sender: profileByUserId[m.senderId] ? { id: m.senderId, name: profileByUserId[m.senderId].name } : null,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[API] GET /api/messages unexpected error:", err);
    const message = (err && (err as any).message) ? (err as any).message : "Error al listar mensajes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const json = await req.json();
    const matchId = String(json?.matchId || "");
    const text = String(json?.text || "").trim();
    console.log(`[API] POST /api/messages incoming userId=${userId} matchId=${matchId} textLen=${text.length}`);
    if (!matchId || !text) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    let ok = false;
    try {
      ok = await ensureCanAccess(matchId, userId);
    } catch (e) {
      console.error("[API] POST /api/messages ensureCanAccess error:", e);
      return NextResponse.json({ error: "Error verificando acceso" }, { status: 500 });
    }
    if (!ok) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    let created: any;
    try {
      created = await prisma.message.create({ data: { matchId, senderId: userId, text } });
    } catch (e) {
      console.error("[API] POST /api/messages prisma.create error:", e);
      return NextResponse.json({ error: "Error guardando mensaje" }, { status: 500 });
    }

    let profile = null;
    try {
      profile = await prisma.profile.findUnique({ where: { userId } });
    } catch (e) {
      console.error("[API] POST /api/messages prisma.profile.findUnique error:", e);
    }
    const message = { ...created, sender: profile ? { id: userId, name: profile.name } : null };

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    try {
      console.error("[API] POST /api/messages error:", err);
    } catch {}
    const message = (err && (err as any).message) ? (err as any).message : "Error al enviar mensaje";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


