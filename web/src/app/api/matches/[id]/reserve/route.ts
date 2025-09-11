import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: any) {
  try {
    const userId = await requireUserId();
    const matchId = params.id as string;
    const body = await _req.json().catch(() => ({}));
    const team = body?.team ?? null;

    const result = await prisma.$transaction(async (tx: any) => {
      // Evitar duplicidad por usuario/partido
      const existing = await tx.spot.findFirst({ where: { matchId, userId } });
      if (existing && (existing.status === "PAID" || (existing.status === "RESERVED" && existing.holdUntil && existing.holdUntil > new Date()))) {
        throw new Response("Ya tienes un cupo reservado", { status: 409 });
      }

      // Crear payment pendiente SIN asignar spot. El spot se asignará solo cuando el pago sea aprobado.
      // Esto evita reservar cupos antes de pagar y evita bloqueos por payments antiguos.
      const anyAvailable = await tx.spot.findFirst({ where: { matchId, status: 'AVAILABLE' } });
      if (!anyAvailable) {
        throw new Response("Sin cupos disponibles", { status: 409 });
      }

      const payment = await tx.payment.create({
        data: { amountCLP: anyAvailable.priceCLP, userId, matchId, team: team ?? null, position: null },
      });

      return { paymentId: payment.id, amountCLP: payment.amountCLP };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err?.message ?? "No se pudo reservar cupo" }, { status: 500 });
  }
}


