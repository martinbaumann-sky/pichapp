import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { approvePayment, confirmMatchAndCapturePayments, refundPayment, rejectPayment } from "@/lib/payments/update";
import {
  fetchMerchantOrder,
  fetchPaymentDetails,
  findVenueByMpUserId,
  parseExternalReference,
  verifyMpSignature,
} from "@/lib/mp/marketplace";
import { getPreapproval } from "@/lib/mp/subscription";
import { getVenuePlan } from "@/lib/venuePlans";
import { sendVenuePlanActivatedEmail, sendVenuePlanCancelledEmail } from "@/lib/venue-subscription-email";

async function resolveVenueIdFromPayment(paymentId: string, mpUserId: string | null) {
  if (mpUserId) {
    const venue = await findVenueByMpUserId(String(mpUserId));
    if (venue) return venue.id;
  }
  const venues = await prisma.venue.findMany({ where: { mpAccessToken: { not: null } }, select: { id: true } });
  for (const venue of venues) {
    try {
      await fetchPaymentDetails(venue.id, paymentId);
      return venue.id;
    } catch (err) {
      continue;
    }
  }
  return null;
}

async function handlePreapprovalUpdate(preapprovalId: string) {
  const subscription = await prisma.venueSubscription.findFirst({
    where: { mpPreapprovalId: preapprovalId },
    include: {
      venue: {
        select: {
          id: true,
          name: true,
          plan: true,
          payoutEmail: true,
          owner: { select: { email: true } },
        },
      },
    },
  });

  if (!subscription || !subscription.venue) {
    console.warn("[mp/webhook] preapproval subscription not found", preapprovalId);
    return;
  }

  const mpPreapproval = await getPreapproval(preapprovalId).catch((err) => {
    console.error("[mp/webhook] preapproval lookup failed", err);
    return null;
  });
  if (!mpPreapproval) return;

  const statusRaw = String(mpPreapproval?.status ?? "").toLowerCase();
  let nextStatus = subscription.status;
  if (statusRaw === "authorized" || statusRaw === "active") {
    nextStatus = "ACTIVE";
  } else if (statusRaw === "paused") {
    nextStatus = "PAUSED";
  } else if (statusRaw === "cancelled" || statusRaw === "canceled") {
    nextStatus = "CANCELED";
  } else if (statusRaw === "expired") {
    nextStatus = "EXPIRED";
  } else if (statusRaw === "pending" || statusRaw === "pending_waiting_payment") {
    nextStatus = "PENDING";
  }

  const nextChargeAt = mpPreapproval?.next_payment_date ? new Date(mpPreapproval.next_payment_date) : null;
  const lastChargeAt = mpPreapproval?.last_charged_date ? new Date(mpPreapproval.last_charged_date) : null;

  const updates: any = {
    status: nextStatus,
    nextChargeAt,
    lastChargeAt,
  };
  if (nextStatus === "ACTIVE" && !subscription.activatedAt) {
    updates.activatedAt = new Date();
  }
  if ((nextStatus === "CANCELED" || nextStatus === "EXPIRED") && !subscription.canceledAt) {
    updates.canceledAt = new Date();
  }

  let activated = false;
  let cancelled = false;

  await prisma.$transaction(async (tx) => {
    await tx.venueSubscription.update({ where: { id: subscription.id }, data: updates });

    if (nextStatus === "ACTIVE") {
      activated = subscription.status !== "ACTIVE";
      await tx.venue.update({ where: { id: subscription.venueId }, data: { plan: subscription.plan } });
      await tx.venueSubscription.updateMany({
        where: {
          venueId: subscription.venueId,
          id: { not: subscription.id },
          status: { in: ["ACTIVE", "PAUSED", "PENDING"] },
        },
        data: { status: "CANCELED", canceledAt: new Date(), cancellationReason: "Reemplazado por nueva suscripción" },
      });
    } else if (nextStatus === "CANCELED" || nextStatus === "EXPIRED") {
      cancelled = subscription.status !== nextStatus;
      const otherActive = await tx.venueSubscription.findFirst({
        where: {
          venueId: subscription.venueId,
          id: { not: subscription.id },
          status: { in: ["ACTIVE", "PAUSED"] },
        },
      });
      if (!otherActive) {
        await tx.venue.update({ where: { id: subscription.venueId }, data: { plan: "gratis" } });
      }
    }
  });

  const dashboardUrl = (() => {
    const base = process.env.NEXT_PUBLIC_BASE_URL?.trim();
    if (base) {
      try {
        const url = new URL(base);
        return `${url.origin}/panel/cancha?tab=billing`;
      } catch {}
    }
    return "http://localhost:3000/panel/cancha?tab=billing";
  })();

  const planInfo = getVenuePlan(subscription.plan);
  const toEmail = subscription.venue.owner?.email || subscription.venue.payoutEmail || null;

  if (activated && planInfo && toEmail) {
    await sendVenuePlanActivatedEmail({
      to: toEmail,
      venueName: subscription.venue.name,
      plan: planInfo.slug,
      dashboardUrl,
    }).catch((err) => console.warn("[mp/webhook] email activated", err));
  }

  if (cancelled && planInfo && planInfo.slug !== "gratis" && toEmail) {
    await sendVenuePlanCancelledEmail({
      to: toEmail,
      venueName: subscription.venue.name,
      plan: planInfo.slug,
      dashboardUrl,
    }).catch((err) => console.warn("[mp/webhook] email cancelled", err));
  }
}

async function handlePaymentUpdate({
  paymentId,
  venueId,
}: {
  paymentId: string;
  venueId: string;
}) {
  const mpPayment = await fetchPaymentDetails(venueId, paymentId);
  const external = parseExternalReference(mpPayment?.external_reference || mpPayment?.order?.external_reference || null);
  if (!external) {
    console.warn("[mp/webhook] external reference missing", { paymentId });
    return;
  }

  const paymentRecord = await prisma.payment.findFirst({
    where: { matchId: external.matchId, spotId: external.reservationId },
    select: { id: true, status: true },
  });
  if (!paymentRecord) {
    console.warn("[mp/webhook] payment record not found", { paymentId, external });
    return;
  }

  const status = String(mpPayment?.status || "").toLowerCase();
  if (status === "authorized") {
    if (paymentRecord.status !== "AUTHORIZED") {
      const result = await approvePayment(paymentRecord.id, String(mpPayment.id), mpPayment, {
        status: "AUTHORIZED",
      });
      if (result?.shouldCheckConfirmation) {
        await confirmMatchAndCapturePayments(result.matchId);
      }
    }
    return;
  }

  if (status === "approved") {
    if (paymentRecord.status !== "APPROVED") {
      await approvePayment(paymentRecord.id, String(mpPayment.id), mpPayment, { status: "APPROVED" });
    }
    return;
  }

  if (status === "refunded") {
    if (paymentRecord.status !== "REFUNDED") {
      await refundPayment(paymentRecord.id, String(mpPayment.id), mpPayment);
    }
    return;
  }

  if (status === "cancelled" || status === "canceled" || status === "rejected") {
    if (paymentRecord.status !== "REJECTED") {
      await rejectPayment(paymentRecord.id, String(mpPayment.id));
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const signatureSecret = process.env.MP_WEBHOOK_SIGNATURE_SECRET;
    const rawBody = await req.text();
    if (signatureSecret) {
      const signature = req.headers.get("x-signature");
      const requestId = req.headers.get("x-request-id");
      if (!verifyMpSignature({ signature, requestId, secret: signatureSecret })) {
        console.warn("[mp/webhook] invalid signature", { requestId });
        return NextResponse.json({ error: "invalid signature" }, { status: 400 });
      }
    }

    const body = rawBody ? JSON.parse(rawBody) : {};
    const query = Object.fromEntries(req.nextUrl.searchParams.entries());
    const eventType = String(body?.type ?? query.type ?? body?.topic ?? "").toLowerCase();
    const mpUserId = body?.user_id ?? body?.data?.user_id ?? query?.user_id ?? null;

    const paymentIds = new Set<string>();
    const preapprovalIds = new Set<string>();

    if (eventType === "payment") {
      const pid = body?.data?.id ?? body?.id ?? query["data.id"] ?? query["id"];
      if (pid) paymentIds.add(String(pid));
    } else if (eventType === "merchant_order") {
      const orderId = body?.data?.id ?? body?.id ?? query["data.id"] ?? query["id"];
      if (orderId) {
        const venues: { id: string }[] = [];
        if (mpUserId) {
          const venue = await findVenueByMpUserId(String(mpUserId));
          if (venue) {
            venues.push({ id: venue.id });
          }
        }
        if (venues.length === 0) {
          const all = await prisma.venue.findMany({ where: { mpAccessToken: { not: null } }, select: { id: true } });
          venues.push(...all);
        }
        for (const venue of venues) {
          try {
            const order = await fetchMerchantOrder(venue.id, String(orderId));
            const payments = Array.isArray(order?.payments) ? order.payments : [];
            for (const p of payments) {
              if (p?.id) paymentIds.add(String(p.id));
            }
            break;
          } catch (err) {
            continue;
          }
        }
      }
    } else if (eventType === "refund") {
      const pid = body?.data?.payment_id ?? body?.payment_id ?? body?.data?.id ?? query["data.id"] ?? null;
      if (pid) paymentIds.add(String(pid));
    } else if (eventType.includes("preapproval")) {
      const preapprovalId =
        body?.data?.id ??
        body?.data?.preapproval_id ??
        body?.preapproval_id ??
        body?.id ??
        query["data.id"] ??
        query["preapproval_id"] ??
        null;
      if (preapprovalId) {
        preapprovalIds.add(String(preapprovalId));
      }
    }

    const ids = Array.from(paymentIds);
    if (ids.length > 0) {
      for (const pid of ids) {
        try {
          const venueId = await resolveVenueIdFromPayment(pid, mpUserId ? String(mpUserId) : null);
          if (!venueId) {
            console.warn("[mp/webhook] could not resolve venue for payment", pid);
            continue;
          }
          await handlePaymentUpdate({ paymentId: pid, venueId });
        } catch (err) {
          console.error("[mp/webhook] payment processing error", pid, err);
        }
      }
    }

    if (preapprovalIds.size > 0) {
      for (const preId of Array.from(preapprovalIds)) {
        try {
          await handlePreapprovalUpdate(preId);
        } catch (err) {
          console.error("[mp/webhook] preapproval error", preId, err);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[mp/webhook]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
