import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { approvePayment, rejectPayment } from "@/lib/payments/update";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const providerRef = body.providerRef ?? body.transaction ?? body.id ?? body.token;
    const status = (body.status ?? body.event ?? "APPROVED").toString().toUpperCase();

    if (!providerRef) return NextResponse.json({ ok: true });

    const payment = await prisma.payment.findFirst({ where: { providerRef: String(providerRef) } });
    if (!payment) return NextResponse.json({ ok: true });

    if (status === "APPROVED" || status === "APPROVAL" || status === "SUCCESS") {
      await approvePayment(payment.id, String(providerRef));
    } else if (status === "REJECTED" || status === "FAILED" || status === "CANCELED") {
      await rejectPayment(payment.id, String(providerRef));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
