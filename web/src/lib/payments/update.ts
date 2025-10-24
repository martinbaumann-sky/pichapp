import type { PaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { captureAuthorizedPayment } from "@/lib/mp/marketplace";
import { getVenuePlan } from "@/lib/venuePlans";

export type ApprovePaymentResult = {
  matchId: string;
  venueId: string | null;
  shouldCheckConfirmation: boolean;
};

function extractProviderFee(raw: unknown): number | null {
  if (!raw || typeof raw !== "object") return null;
  const source: any = raw;
  const feeDetails = Array.isArray(source.fee_details) ? source.fee_details : source.feeDetails;
  if (Array.isArray(feeDetails)) {
    const total = feeDetails.reduce((sum: number, item: any) => {
      const amount = typeof item?.amount === "number" ? item.amount : Number(item?.amount ?? 0);
      if (!Number.isFinite(amount)) return sum;
      return sum + amount;
    }, 0);
    if (Number.isFinite(total)) {
      return Math.round(total);
    }
  }
  const transaction = source.transaction_details ?? source.transactionDetails;
  if (transaction && typeof transaction === "object") {
    const totalPaid = Number((transaction as any).total_paid_amount ?? (transaction as any).totalPaidAmount ?? NaN);
    const netReceived = Number((transaction as any).net_received_amount ?? (transaction as any).netReceivedAmount ?? NaN);
    if (Number.isFinite(totalPaid) && Number.isFinite(netReceived)) {
      const fee = totalPaid - netReceived;
      if (Number.isFinite(fee)) {
        return Math.round(fee);
      }
    }
  }
  return null;
}

function maskAccountNumber(account: string | null | undefined): string {
  if (!account) return "Cuenta registrada";
  const trimmed = String(account).replace(/\s+/g, "");
  if (trimmed.length <= 4) return trimmed;
  return `••••${trimmed.slice(-4)}`;
}

export async function approvePayment(
  paymentId: string,
  providerRef?: string,
  raw?: unknown,
  options?: { status?: PaymentStatus },
): Promise<ApprovePaymentResult | null> {
  const targetStatus = options?.status ?? "APPROVED";
  if (targetStatus !== "APPROVED" && targetStatus !== "AUTHORIZED") {
    throw new Error(`Estado de aprobación no soportado: ${targetStatus}`);
  }

  let result: ApprovePaymentResult | null = null;

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        match: {
          select: {
            id: true,
            venueId: true,
            minSpotsToConfirm: true,
            totalSpots: true,
            status: true,
            venue: {
              select: {
                id: true,
                plan: true,
                payoutMethod: true,
                payoutEmail: true,
                bankName: true,
                bankAccountType: true,
                bankAccountNumber: true,
                bankAccountRut: true,
              },
            },
          },
        },
        payout: true,
      },
    });

    if (!payment) {
      throw new Error("Pago no encontrado");
    }

    if (payment.status === targetStatus) {
      result = {
        matchId: payment.matchId,
        venueId: payment.match?.venueId ?? null,
        shouldCheckConfirmation: false,
      };
      return;
    }

    let spotId = payment.spotId ?? null;
    if (!spotId) {
      const availableSpot = await tx.spot.findFirst({
        where: { matchId: payment.matchId, status: "AVAILABLE" },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (!availableSpot) {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: "REJECTED", providerRef: providerRef ?? payment.providerRef },
        });
        result = {
          matchId: payment.matchId,
          venueId: payment.match?.venueId ?? null,
          shouldCheckConfirmation: false,
        };
        return;
      }
      spotId = availableSpot.id;
    }

    const paymentUpdate: any = {
      status: targetStatus,
      providerRef: providerRef ?? payment.providerRef,
    };
    if (raw !== undefined) {
      paymentUpdate.raw = raw;
    }
    if (!payment.spotId && spotId) {
      paymentUpdate.spotId = spotId;
    }

    await tx.payment.update({ where: { id: paymentId }, data: paymentUpdate });

    if (spotId) {
      const spotUpdate: any = {
        status: "PAID",
        userId: payment.userId,
        holdUntil: null,
      };
      if (payment.team) {
        spotUpdate.team = payment.team;
      }
      if (payment.position) {
        spotUpdate.position = payment.position;
      }
      await tx.spot.update({ where: { id: spotId }, data: spotUpdate });
    }

    if (targetStatus === "APPROVED" && payment.match?.venueId && payment.match?.venue) {
      const venueInfo = payment.match.venue;
      const planInfo = getVenuePlan(venueInfo.plan ?? "gratis");
      const commissionRate = planInfo?.commissionRate ?? 0.14;
      const platformFee = Math.max(0, Math.round(payment.amountCLP * commissionRate));
      const rawSource = raw ?? payment.raw ?? null;
      const extractedProviderFee = extractProviderFee(rawSource);
      const fallbackProviderFee = Math.round(payment.amountCLP * 0.035);
      const providerFee = Math.max(0, extractedProviderFee ?? fallbackProviderFee);
      const netAmount = Math.max(0, payment.amountCLP - platformFee - providerFee);
      const payoutMethod = (venueInfo.payoutMethod as string) ?? "MP_WALLET";
      let destination: string | null = null;
      if (payoutMethod === "BANK_TRANSFER") {
        const parts = [venueInfo.bankName ?? "Banco"];
        if (venueInfo.bankAccountType) {
          parts.push(String(venueInfo.bankAccountType));
        }
        const label = parts.filter(Boolean).join(" · ");
        destination = `${label} ${maskAccountNumber(venueInfo.bankAccountNumber ?? null)}`.trim();
      } else {
        destination = venueInfo.payoutEmail ?? null;
      }

      await tx.venuePayout.upsert({
        where: { paymentId: payment.id },
        update: {
          method: payoutMethod as any,
          amountCLP: payment.amountCLP,
          platformFeeCLP: platformFee,
          providerFeeCLP: providerFee,
          netAmountCLP: netAmount,
          destination,
          status: payment.match.status === "CONFIRMED" ? "PAID" : "PENDING",
          processedAt: payment.match.status === "CONFIRMED" ? new Date() : payment.payout?.processedAt ?? null,
        },
        create: {
          venueId: payment.match.venueId,
          matchId: payment.match.id,
          paymentId: payment.id,
          method: payoutMethod as any,
          amountCLP: payment.amountCLP,
          platformFeeCLP: platformFee,
          providerFeeCLP: providerFee,
          netAmountCLP: netAmount,
          destination,
          status: payment.match.status === "CONFIRMED" ? "PAID" : "PENDING",
          processedAt: payment.match.status === "CONFIRMED" ? new Date() : null,
        },
      });
    }

    const remaining = await tx.spot.count({ where: { matchId: payment.matchId, status: "AVAILABLE" } });
    if (remaining === 0) {
      await tx.match.update({ where: { id: payment.matchId }, data: { status: "FULL" } }).catch(() => null);
    } else if (payment.match?.status !== "CONFIRMED") {
      await tx.match.update({ where: { id: payment.matchId }, data: { status: "PUBLISHED" } }).catch(() => null);
    }

    const paidCount = await tx.spot.count({ where: { matchId: payment.matchId, status: "PAID" } });
    const minRequired =
      payment.match && payment.match.minSpotsToConfirm > 0
        ? payment.match.minSpotsToConfirm
        : payment.match?.totalSpots ?? 0;

    result = {
      matchId: payment.matchId,
      venueId: payment.match?.venueId ?? null,
      shouldCheckConfirmation:
        targetStatus === "AUTHORIZED" && payment.match?.status !== "CONFIRMED" && paidCount >= minRequired,
    };
  });

  return result;
}

export async function confirmMatchAndCapturePayments(matchId: string) {
  const summary = await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        venueId: true,
        minSpotsToConfirm: true,
        totalSpots: true,
        status: true,
      },
    });

    if (!match) {
      return null;
    }

    const paidCount = await tx.spot.count({ where: { matchId, status: "PAID" } });
    const minRequired = match.minSpotsToConfirm > 0 ? match.minSpotsToConfirm : match.totalSpots;

    if (paidCount < minRequired) {
      return {
        venueId: match.venueId,
        capturePayments: [] as { id: string; providerRef: string }[],
        confirmed: false,
      };
    }

    if (match.status !== "CONFIRMED") {
      await tx.match.update({ where: { id: matchId }, data: { status: "CONFIRMED" } }).catch(() => null);
    }

    const capturePayments = await tx.payment.findMany({
      where: {
        matchId,
        provider: "MP",
        status: "AUTHORIZED",
        providerRef: { not: null },
      },
      select: { id: true, providerRef: true },
    });

    await tx.venuePayout.updateMany({
      where: { matchId, status: "PENDING" },
      data: { status: "PAID", processedAt: new Date() },
    }).catch(() => null);

    return {
      venueId: match.venueId,
      capturePayments: capturePayments.map((p) => ({ id: p.id, providerRef: String(p.providerRef) })),
      confirmed: true,
    };
  });

  if (!summary) {
    return { confirmed: false, captured: 0 };
  }

  const { venueId, capturePayments, confirmed } = summary;
  if (!venueId || capturePayments.length === 0) {
    return { confirmed, captured: 0 };
  }

  let captured = 0;
  for (const payment of capturePayments) {
    try {
      const captureResponse = await captureAuthorizedPayment({
        venueId,
        paymentId: payment.providerRef,
        idempotencyKey: `capture-${payment.providerRef}`,
      });
      await approvePayment(payment.id, payment.providerRef, captureResponse ?? undefined, { status: "APPROVED" });
      captured += 1;
    } catch (err) {
      console.error("[payments] capture error", { matchId, paymentId: payment.id }, err);
    }
  }

  return { confirmed, captured };
}

export async function rejectPayment(paymentId: string, providerRef?: string) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return;

    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "REJECTED", providerRef: providerRef ?? payment.providerRef, raw: undefined },
    });

    if (payment.spotId) {
      await tx.spot.update({ where: { id: payment.spotId }, data: { status: "AVAILABLE", userId: null, holdUntil: null } });
    }
  });
}

export async function refundPayment(paymentId: string, providerRef?: string, raw?: unknown) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return;

    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "REFUNDED", providerRef: providerRef ?? payment.providerRef, raw: raw ?? undefined },
    });

    if (payment.spotId) {
      await tx.spot.update({
        where: { id: payment.spotId },
        data: { status: "REFUNDED", holdUntil: null },
      });
    }
  });
}
