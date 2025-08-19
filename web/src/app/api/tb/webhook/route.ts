import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const providerRef = body.providerRef ?? body.transaction ?? body.id;
    const status = body.status ?? "APPROVED";

    if (!providerRef) return NextResponse.json({ ok: true });

    const payment = await prisma.payment.findFirst({ where: { providerRef: String(providerRef) } });
    if (!payment) return NextResponse.json({ ok: true });

    if (status === "APPROVED" || status === "approved") {
      await prisma.$transaction(async (tx: any) => {
        const availableSpot = await tx.spot.findFirst({ where: { matchId: payment.matchId, status: 'AVAILABLE' }, orderBy: { createdAt: 'asc' } });
        if (!availableSpot) {
          await tx.payment.update({ where: { id: payment.id }, data: { status: 'REJECTED' } });
          return;
        }

        await tx.payment.update({ where: { id: payment.id }, data: { status: 'APPROVED', spotId: availableSpot.id } });
        await tx.spot.update({ where: { id: availableSpot.id }, data: { status: 'PAID', userId: payment.userId, holdUntil: null } });

        const counts = await tx.spot.groupBy({ by: ["status"], where: { matchId: payment.matchId }, _count: { _all: true } });
        const available = counts.find((c: any) => c.status === "AVAILABLE")?._count._all ?? 0;
        if (available === 0) await tx.match.update({ where: { id: payment.matchId }, data: { status: "FULL" } });
      });
    } else if (status === "REJECTED" || status === "rejected") {
      await prisma.$transaction(async (tx: any) => {
        await tx.payment.update({ where: { id: payment.id }, data: { status: "REJECTED" } });
        if (payment.spotId) await tx.spot.update({ where: { id: payment.spotId }, data: { status: "AVAILABLE", userId: null, holdUntil: null } });
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}


