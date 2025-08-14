import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = Object.fromEntries(new URL(req.url).searchParams.entries());

    // Mercado Pago puede enviar via query params (topic, id) o body
    const paymentId = body?.data?.id ?? query["data.id"] ?? body?.id ?? query["id"];
    if (!paymentId) return NextResponse.json({ ok: true });

    // Lookup Payment by providerRef
    const payment = await prisma.payment.findFirst({ where: { providerRef: String(paymentId) } });
    if (!payment) return NextResponse.json({ ok: true });

    // En un entorno real, consultar a MP el estado del pago por API.
    // Aquí aceptamos webhook como fuente de verdad simplificada opcionalmente con body.status
    const status = body?.status ?? body?.data?.status ?? "APPROVED"; // fallback para sandbox

    if (status === "approved" || status === "APPROVED") {
      await prisma.$transaction(async (tx: any) => {
        await tx.payment.update({ where: { id: payment.id }, data: { status: "APPROVED" } });
        await tx.spot.update({ where: { id: payment.spotId! }, data: { status: "PAID", holdUntil: null } });

        // Si el match quedó lleno, marcar FULL
        const counts = await tx.spot.groupBy({
          by: ["status"],
          where: { matchId: payment.matchId },
          _count: { _all: true },
        });
        const available = counts.find((c: any) => c.status === "AVAILABLE")?._count._all ?? 0;
        if (available === 0) {
          await tx.match.update({ where: { id: payment.matchId }, data: { status: "FULL" } });
        }
      });
    } else if (status === "rejected" || status === "REJECTED") {
      await prisma.$transaction(async (tx: any) => {
        await tx.payment.update({ where: { id: payment.id }, data: { status: "REJECTED" } });
        if (payment.spotId) {
          await tx.spot.update({
            where: { id: payment.spotId },
            data: { status: "AVAILABLE", userId: null, holdUntil: null },
          });
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
