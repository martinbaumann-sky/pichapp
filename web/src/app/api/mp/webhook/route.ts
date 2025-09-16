import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { approvePayment, rejectPayment } from "@/lib/payments/update";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = Object.fromEntries(new URL(req.url).searchParams.entries());

    const paymentIdValue = body?.data?.id ?? query["data.id"] ?? body?.id ?? query["id"];
    if (!paymentIdValue) return NextResponse.json({ ok: true });

    const payment = await prisma.payment.findFirst({ where: { providerRef: String(paymentIdValue) } });
    if (!payment) return NextResponse.json({ ok: true });

    const status = String(body?.status ?? body?.data?.status ?? "approved").toLowerCase();

    if (status === "approved" || status === "success") {
      await approvePayment(payment.id, String(paymentIdValue));
    } else if (status === "rejected" || status === "cancelled" || status === "canceled") {
      await rejectPayment(payment.id, String(paymentIdValue));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
