import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: { id: string } } | { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const p: any = (ctx as any)?.params;
    const { id: matchId } = (p && typeof p.then === 'function') ? await p : p;
    const body = await req.json().catch(() => ({}));
    const paymentId = body.paymentId as string | undefined;
    const provider = (body.provider ?? "MP") as string;

    if (!paymentId) return NextResponse.json({ error: "paymentId requerido" }, { status: 400 });

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return NextResponse.json({ error: "payment no encontrado" }, { status: 404 });
    if (payment.userId !== userId) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    if (provider === "TB") {
      const { createTbTransaction } = await import("@/lib/tb_sandbox");
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
      const tbResp = await createTbTransaction({ paymentId: payment.id, amount: payment.amountCLP, matchId, baseUrl });
      await prisma.payment.update({ where: { id: payment.id }, data: { provider: "TB", providerRef: tbResp.providerRef } as any });
      return NextResponse.json({ checkoutUrl: tbResp.checkoutUrl });
    }

    // MercadoPago
    const { getMpPreferenceClient } = await import("@/lib/mp");
    const prefClient = getMpPreferenceClient();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

    const pref = await prefClient.create({
      body: {
        items: [
          { id: payment.id, title: "Cupo Pichanga", quantity: 1, currency_id: "CLP", unit_price: payment.amountCLP },
        ],
        notification_url: `${baseUrl}/api/mp/webhook`,
        back_urls: { success: `${baseUrl}/match/${matchId}/chat?paid=1`, failure: `${baseUrl}/match/${matchId}?paid=0`, pending: `${baseUrl}/match/${matchId}?paid=0` },
        metadata: { paymentId: payment.id, matchId },
        statement_descriptor: "PICHANGA CUPOS",
      },
    });

    await prisma.payment.update({ where: { id: payment.id }, data: { provider: "MP", providerRef: (pref as any).id ?? (pref as any).response?.id } as any });

    return NextResponse.json({ init_point: (pref as any).init_point ?? (pref as any).sandbox_init_point ?? (pref as any).response?.init_point });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err?.message ?? "No se pudo iniciar checkout" }, { status: 500 });
  }
}


