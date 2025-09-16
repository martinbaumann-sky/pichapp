import { NextRequest, NextResponse } from "next/server";
import { approvePayment, rejectPayment } from "@/lib/payments/update";

function parseCustom(value: unknown): { paymentId?: string } {
  if (!value) return {};
  if (typeof value === "object") return value as any;
  try {
    return JSON.parse(String(value));
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const receiverId = process.env.KHIPU_RECEIVER_ID;
    const secret = process.env.KHIPU_SECRET_KEY;
    if (!receiverId || !secret) {
      return NextResponse.json({ ok: true });
    }

    const body = await req.json().catch(() => ({}));
    let payload: any = body;

    if (body.notification_token) {
      const auth = Buffer.from(`${receiverId}:${secret}`).toString("base64");
      try {
        const res = await fetch(`https://khipu.com/api/2.0/notifications/${body.notification_token}`, {
          headers: { Authorization: `Basic ${auth}` },
        });
        if (res.ok) {
          payload = await res.json();
        }
      } catch {}
    }

    const custom = parseCustom(payload.custom);
    const paymentId = custom.paymentId || payload.transaction_id || payload.id || body.paymentId;
    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    const providerRef = String(payload.payment_id || payload.id || paymentId);
    const status = String(payload.status || payload.state || "").toLowerCase();

    if (["done", "paid", "success", "completed"].includes(status)) {
      await approvePayment(paymentId, providerRef);
    } else if (["failed", "canceled", "rejected", "error"].includes(status)) {
      await rejectPayment(paymentId, providerRef);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
