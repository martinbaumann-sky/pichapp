import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const q = Object.fromEntries(new URL(req.url).searchParams.entries());
    const paymentId = q.paymentId as string | undefined;
    const providerRef = q.providerRef as string | undefined;
    if (!paymentId) return NextResponse.json({ error: "missing paymentId" }, { status: 400 });

    // Simular checkout: mostrar una página simple o redirigir directamente al success
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    // Redirigir a callback success (simulamos pago aprobado)
    // En un escenario real, Transbank redirigiría al usuario y/o enviaría webhook.
    return NextResponse.redirect(`${baseUrl}/match/${encodeURIComponent(req.nextUrl.searchParams.get("matchId") ?? "")}?paid=1`);
  } catch (err) {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Endpoint para simular webhook desde sandbox UI si se desea
    const body = await req.json().catch(() => ({}));
    const providerRef = body.providerRef as string | undefined;
    const paymentId = body.paymentId as string | undefined;
    if (!paymentId || !providerRef) return NextResponse.json({ error: "missing" }, { status: 400 });

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return NextResponse.json({ error: "not found" }, { status: 404 });

    await prisma.$transaction(async (tx: any) => {
      await tx.payment.update({ where: { id: paymentId }, data: { status: "APPROVED", providerRef } });
      if (payment.spotId) await tx.spot.update({ where: { id: payment.spotId }, data: { status: "PAID", holdUntil: null } });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}


