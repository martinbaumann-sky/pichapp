import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, ctx: { params: { id: string } } | { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    // In Next 14/15, params can be a Promise in route handlers
    // to support async param generation. Await it defensively.
    const p: any = (ctx as any)?.params;
    const { id: matchId } = (p && typeof p.then === 'function') ? await p : p;
    const body = await _req.json().catch(() => ({}));
    const team = body?.team ?? null;

    const result = await prisma.$transaction(async (tx: any) => {
      // Evitar duplicidad por usuario/partido
      // Select only existing DB columns to avoid errors if local dev DB
      // hasn't been migrated to latest schema (e.g., missing `team`).
      const existing = await tx.spot.findFirst({
        where: { matchId, userId },
        select: { id: true, status: true, holdUntil: true },
      });
      if (existing && (existing.status === "PAID" || (existing.status === "RESERVED" && existing.holdUntil && existing.holdUntil > new Date()))) {
        throw new Response("Ya tienes un cupo reservado", { status: 409 });
      }

      // Crear payment pendiente SIN asignar spot. El spot se asignará solo cuando el pago sea aprobado.
      // Esto evita reservar cupos antes de pagar y evita bloqueos por payments antiguos.
      const anyAvailable = await tx.spot.findFirst({
        where: { matchId, status: 'AVAILABLE' },
        select: { id: true, priceCLP: true },
      });
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


