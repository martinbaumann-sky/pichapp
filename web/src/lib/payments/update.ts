import { prisma } from "@/lib/db";

export async function approvePayment(paymentId: string, providerRef?: string) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new Error("Pago no encontrado");
    }

    let spotId = payment.spotId;
    if (!spotId) {
      const availableSpot = await tx.spot.findFirst({ where: { matchId: payment.matchId, status: "AVAILABLE" }, orderBy: { createdAt: "asc" } });
      if (!availableSpot) {
        await tx.payment.update({ where: { id: paymentId }, data: { status: "REJECTED", providerRef: providerRef ?? payment.providerRef } });
        return;
      }
      spotId = availableSpot.id;
    }

    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "APPROVED", providerRef: providerRef ?? payment.providerRef, spotId },
    });

    await tx.spot.update({
      where: { id: spotId },
      data: { status: "PAID", userId: payment.userId, holdUntil: null },
    });

    const remaining = await tx.spot.count({ where: { matchId: payment.matchId, status: "AVAILABLE" } });
    if (remaining === 0) {
      await tx.match.update({ where: { id: payment.matchId }, data: { status: "FULL" } });
    }
  });
}

export async function rejectPayment(paymentId: string, providerRef?: string) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return;

    await tx.payment.update({ where: { id: paymentId }, data: { status: "REJECTED", providerRef: providerRef ?? payment.providerRef } });

    if (payment.spotId) {
      await tx.spot.update({ where: { id: payment.spotId }, data: { status: "AVAILABLE", userId: null, holdUntil: null } });
    }
  });
}
