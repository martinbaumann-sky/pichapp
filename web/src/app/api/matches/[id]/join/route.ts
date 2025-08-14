import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { getMpPreferenceClient } from "@/lib/mp";

export async function POST(_req: NextRequest, { params }: any) {
  try {
    const userId = await requireUserId();
    const matchId = params.id as string;

    const prefClient = getMpPreferenceClient();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

    const result = await prisma.$transaction(async (tx: any) => {
      // Evitar duplicidad por usuario/partido
      const existing = await tx.spot.findFirst({ where: { matchId, userId } });
      if (existing && (existing.status === "PAID" || (existing.status === "RESERVED" && existing.holdUntil && existing.holdUntil > new Date()))) {
        throw new Response("Ya tienes un cupo reservado", { status: 409 });
      }

      // Intentar tomar un spot disponible con lock
      const holdUntil = new Date(Date.now() + 10 * 60 * 1000);

      const updated = (await (tx as any).$queryRawUnsafe(
        `WITH cte AS (
          SELECT id FROM "Spot"
          WHERE "matchId" = $1 AND status = 'AVAILABLE'
          ORDER BY "createdAt" ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        UPDATE "Spot" s
        SET status='RESERVED', "userId"=$2, "holdUntil"=$3
        FROM cte
        WHERE s.id = cte.id
        RETURNING s.*;`,
        matchId,
        userId,
        holdUntil
      )) as any;

      const spot = Array.isArray(updated) ? updated[0] : updated;
      if (!spot) {
        throw new Response("Sin cupos disponibles", { status: 409 });
      }

      // Crear Payment PENDING
      const payment = await tx.payment.create({
        data: {
          amountCLP: spot.priceCLP,
          userId,
          matchId,
          spotId: spot.id,
        },
      });

      // Crear preferencia de pago
      const pref = await prefClient.create({
        body: {
          items: [
            {
              id: spot.id,
              title: "Cupo Pichanga",
              quantity: 1,
              currency_id: "CLP",
              unit_price: spot.priceCLP,
            },
          ],
          notification_url: `${baseUrl}/api/mp/webhook`,
          back_urls: {
            success: `${baseUrl}/match/${matchId}?paid=1`,
            failure: `${baseUrl}/match/${matchId}?paid=0`,
            pending: `${baseUrl}/match/${matchId}?paid=0`,
          },
          metadata: { paymentId: payment.id, spotId: spot.id, matchId },
          statement_descriptor: "PICHANGA CUPOS",
          expires: true,
          expiration_date_from: new Date().toISOString(),
          expiration_date_to: holdUntil.toISOString(),
        },
      });

      await tx.payment.update({ where: { id: payment.id }, data: { providerRef: (pref as any).id ?? (pref as any).response?.id } as any });

      return { init_point: (pref as any).init_point ?? (pref as any).sandbox_init_point ?? (pref as any).response?.init_point };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err?.message ?? "No se pudo reservar cupo" }, { status: 500 });
  }
}
