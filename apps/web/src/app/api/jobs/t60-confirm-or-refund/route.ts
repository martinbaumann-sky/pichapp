import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { confirmMatchAndCapturePayments, refundPayment } from "@/lib/payments/update";
import { createRefundForPayment, ensureVenueAccessToken } from "@/lib/mp/marketplace";

function requireCronAuth(req: NextRequest) {
  const secret = process.env.CRON_T60_SECRET;
  if (!secret) {
    throw new Error("CRON_T60_SECRET no configurado");
  }
  const header = req.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  if (header !== expected) {
    throw new Error("No autorizado");
  }
}

function getTargetWindow(graceMinutes: number) {
  const now = Date.now();
  const target = now + graceMinutes * 60 * 1000;
  const windowMs = 5 * 60 * 1000;
  return {
    start: new Date(target - windowMs),
    end: new Date(target + windowMs),
  };
}

export async function POST(req: NextRequest) {
  try {
    requireCronAuth(req);
    const grace = Number(process.env.CRON_T60_GRACE_MINUTES ?? "60");
    const { start, end } = getTargetWindow(Math.max(grace, 1));

    const matches = await prisma.match.findMany({
      where: {
        startsAt: { gte: start, lte: end },
        status: { in: ["PUBLISHED", "FULL"] },
      },
      select: {
        id: true,
        venueId: true,
        minSpotsToConfirm: true,
        totalSpots: true,
      },
    });

    const summary: {
      matchId: string;
      action: "confirmed" | "refunded" | "skipped";
      refunds?: number;
      captured?: number;
    }[] = [];

    for (const match of matches) {
      const minRequired = match.minSpotsToConfirm > 0 ? match.minSpotsToConfirm : match.totalSpots;
      const paidCount = await prisma.spot.count({ where: { matchId: match.id, status: "PAID" } });

      if (paidCount >= minRequired) {
        const captureSummary = await confirmMatchAndCapturePayments(match.id).catch((err) => {
          console.error(`[t60] confirm error`, { matchId: match.id }, err);
          return { confirmed: false, captured: 0 };
        });
        summary.push({ matchId: match.id, action: "confirmed", captured: captureSummary.captured });
        continue;
      }

      console.log(`[t60] canceling match ${match.id}, paid=${paidCount}, required=${minRequired}`);
      await prisma.match.update({ where: { id: match.id }, data: { status: "CANCELED_MINIMUM" } }).catch(() => null);

      const payments = await prisma.payment.findMany({
        where: {
          matchId: match.id,
          provider: "MP",
          status: { in: ["APPROVED", "AUTHORIZED" as any] },
        },
        select: { id: true, providerRef: true, status: true },
      });

      let refunds = 0;
      for (const payment of payments) {
        if (!payment.providerRef) continue;
        try {
          if (!match.venueId) {
            console.warn(`[t60] match ${match.id} sin venueId`);
            continue;
          }

          await createRefundForPayment({
            venueId: match.venueId,
            paymentId: payment.providerRef,
            idempotencyKey: `refund-${payment.providerRef}`,
          });
          await refundPayment(payment.id, payment.providerRef);
          refunds += 1;
        } catch (err) {
          console.error(`[t60] refund error`, { matchId: match.id, paymentId: payment.id }, err);
        }
      }

      summary.push({ matchId: match.id, action: "refunded", refunds });
    }

    return NextResponse.json({ ok: true, processed: summary });
  } catch (err: any) {
    if (err instanceof Error && err.message === "No autorizado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("[t60] job error", err);
    return NextResponse.json({ error: err?.message ?? "error" }, { status: 500 });
  }
}
