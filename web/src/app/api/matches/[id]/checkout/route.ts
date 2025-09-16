import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { initPaymentSession, ProviderKey } from "@/lib/payments/providers";

export const dynamic = 'force-dynamic';

function resolveBaseUrl(req: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (envUrl) return envUrl;
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(req: NextRequest, ctx: { params: { id: string } } | { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const p: any = (ctx as any)?.params;
    const { id: matchId } = (p && typeof p.then === 'function') ? await p : p;
    const body = await req.json().catch(() => ({}));
    const paymentId = body.paymentId as string | undefined;
    const providerRaw = String(body.provider || "MP").toUpperCase();

    if (!paymentId) return NextResponse.json({ error: "paymentId requerido" }, { status: 400 });

    const provider = providerRaw as ProviderKey;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        match: { select: { id: true, title: true, comuna: true } },
        user: { select: { id: true, email: true, profile: { select: { name: true } } } },
      },
    });
    if (!payment) return NextResponse.json({ error: "payment no encontrado" }, { status: 404 });
    if (payment.userId !== userId) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const baseUrl = resolveBaseUrl(req);

    const result = await initPaymentSession({
      provider,
      payment: { id: payment.id, amountCLP: payment.amountCLP },
      match: { id: payment.matchId, title: payment.match?.title ?? null, comuna: payment.match?.comuna ?? null },
      baseUrl,
      user: { email: payment.user?.email ?? null, name: payment.user?.profile?.name ?? null },
    });

    await prisma.payment.update({ where: { id: payment.id }, data: { provider: provider as any, providerRef: result.providerRef } });

    if (result.type === "qr") {
      return NextResponse.json({ type: "qr", qrUrl: result.qrUrl, qrData: result.qrData, url: result.url ?? null });
    }

    return NextResponse.json({ type: "redirect", url: result.url });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err?.message ?? "No se pudo iniciar checkout" }, { status: 500 });
  }
}
