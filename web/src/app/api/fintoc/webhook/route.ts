import { NextRequest, NextResponse } from "next/server";
import { approvePayment, rejectPayment } from "@/lib/payments/update";

function extractPaymentId(payload: any): string | null {
  if (!payload) return null;
  if (payload.reference_id) return String(payload.reference_id);
  if (payload.payment_id) return String(payload.payment_id);
  if (payload.payment?.reference_id) return String(payload.payment.reference_id);
  if (payload.data?.reference_id) return String(payload.data.reference_id);
  if (payload.data?.attributes?.reference_id) return String(payload.data.attributes.reference_id);
  if (payload.data?.id) return String(payload.data.id);
  return null;
}

function extractStatus(payload: any): string {
  if (!payload) return "";
  if (payload.status) return String(payload.status);
  if (payload.payment?.status) return String(payload.payment.status);
  if (payload.data?.status) return String(payload.data.status);
  if (payload.data?.attributes?.status) return String(payload.data.attributes.status);
  if (payload.event) return String(payload.event);
  if (payload.type) return String(payload.type);
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.FINTOC_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ ok: true });
    }

    const body = await req.json().catch(() => ({}));
    const paymentId = extractPaymentId(body);
    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    const status = extractStatus(body).toLowerCase();
    if (["succeeded", "paid", "confirmed", "completed"].includes(status)) {
      await approvePayment(paymentId, body.id ? String(body.id) : undefined);
    } else if (["failed", "rejected", "cancelled", "canceled", "error"].includes(status)) {
      await rejectPayment(paymentId, body.id ? String(body.id) : undefined);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
