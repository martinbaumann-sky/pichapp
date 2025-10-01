import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

const CANCELLATION_WINDOW_MS = 2 * 60 * 60 * 1000;

export async function POST(
  _req: NextRequest,
  ctx: { params: { id: string } } | { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const rawParams: any = (ctx as any)?.params ?? ctx;
    const resolved: any = typeof rawParams?.then === "function" ? await rawParams : rawParams;
    const id: string | undefined = resolved?.id ?? resolved?.params?.id;
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id },
      select: { organizerId: true, startsAt: true, status: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    let isAdmin = false;
    if (match.organizerId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true, role: true },
      });
      isAdmin = !!user && (user.isAdmin || user.role === "SUPERADMIN");
      if (!isAdmin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    if (match.status === "CANCELED") {
      return NextResponse.json({ error: "El partido ya está cancelado." }, { status: 400 });
    }
    if (match.status === "FINISHED") {
      return NextResponse.json({ error: "No puedes cancelar un partido finalizado." }, { status: 400 });
    }

    const startsAt = new Date(match.startsAt).getTime();
    if (Number.isNaN(startsAt)) {
      return NextResponse.json({ error: "Fecha del partido inválida" }, { status: 400 });
    }
    if (startsAt - Date.now() < CANCELLATION_WINDOW_MS) {
      return NextResponse.json({ error: "Solo puedes cancelar hasta 2 horas antes del inicio." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.match.update({
        where: { id },
        data: { status: "CANCELED", public: false },
      }),
      prisma.spot.updateMany({
        where: { matchId: id, status: { in: ["RESERVED", "PAID"] } },
        data: { status: "CANCELED" },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[venue/matches/cancel]", error);
    return NextResponse.json({ error: "No se pudo cancelar el partido" }, { status: 500 });
  }
}
