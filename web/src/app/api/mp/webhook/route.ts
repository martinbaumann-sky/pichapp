import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { approvePayment, refundPayment, rejectPayment } from "@/lib/payments/update";
import {
  fetchMerchantOrder,
  fetchPaymentDetails,
  findVenueByMpUserId,
  parseExternalReference,
  verifyMpSignature,
} from "@/lib/mp/marketplace";

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
  if (status === "approved") {
    if (paymentRecord.status !== "APPROVED") {
      await approvePayment(paymentRecord.id, String(mpPayment.id), mpPayment);
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
    }

    const ids = Array.from(paymentIds);
    if (ids.length === 0) {
      return NextResponse.json({ ok: true });
    }

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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[mp/webhook]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
