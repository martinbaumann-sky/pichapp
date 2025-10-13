import { NextRequest, NextResponse } from "next/server";
import { PaymentProvider } from "@prisma/client";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeTeam } from "@/lib/teams";
import { sanitizePosition } from "@/lib/teamAssignment";
import { getEnabledProviders, initPaymentSession } from "@/lib/payments/providers";
import { isProfileIncomplete, PROFILE_COMPLETION_REQUIRED_MESSAGE } from "@/lib/profileCompletion";
import { decryptSecret } from "@/lib/encryption";

const DEFAULT_HOLD_MINUTES = 15;

type FlowCredentials = { apiKey: string; secret: string; env: "PROD" | "SANDBOX" };

type TxResultPending = {
  status: "pending_payment";
  match: { id: string; title: string | null; comuna: string | null; venueId: string | null };
  payment: { id: string; amountCLP: number; spotId: string };
  holdUntil: Date | null;
  user: { email: string | null; name: string | null };
  provider: PaymentProvider;
  flowCredentials: FlowCredentials | null;
};

type TxResult = { status: "free" } | { status: "already_paid" } | TxResultPending;

function resolveBaseUrl(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const host = req.headers.get("host");
  if (host) {
    const protocol = req.nextUrl.protocol ?? "https:";
    return `${protocol}//${host}`;
  }
  return req.nextUrl.origin;
}

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  ctx: { params: { id: string } } | { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const p: any = (ctx as any)?.params;
    const { id: matchId } = (p && typeof p.then === "function") ? await p : p;
    if (!matchId) {
      return NextResponse.json({ error: "id requerido" }, { status: 400 });
    }

    const viewerProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { phone: true, comuna: true },
    });
    if (isProfileIncomplete(viewerProfile)) {
      return NextResponse.json(
        {
          error: PROFILE_COMPLETION_REQUIRED_MESSAGE,
          requiresProfile: true,
        },
        { status: 409 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const requestedTeam = normalizeTeam(body?.team ?? null);
    const requestedPosition = sanitizePosition(body?.position ?? null);

    const holdMinutes = Number(process.env.MATCH_PAYMENT_HOLD_MINUTES ?? DEFAULT_HOLD_MINUTES);
    const holdMs = Math.max(1, holdMinutes) * 60 * 1000;
    const holdUntilTarget = new Date(Date.now() + holdMs);

    const txResult = (await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        select: {
          id: true,
          title: true,
          comuna: true,
          pricePerSpot: true,
          venueId: true,
        },
      });
      if (!match) {
        throw new Response("Partido no encontrado", { status: 404 });
      }
      if ((match.pricePerSpot ?? 0) <= 0) {
        return { status: "free" as const } satisfies TxResult;
      }

      if (!match.venueId) {
        throw new Response("Este partido no tiene una cancha asociada para procesar el pago.", { status: 400 });
      }

      const venue = await tx.venue.findUnique({
        where: { id: match.venueId },
        select: {
          id: true,
          payoutEmail: true,
          accountHolder: true,
          paymentProvider: true,
          mpAccessToken: true,
          mpCollectorId: true,
          mpAccountType: true,
          flowApiKey: true,
          flowSecretKey: true,
          flowEnv: true,
        },
      });

      if (!venue) {
        throw new Response("No encontramos la cancha asociada al partido.", { status: 404 });
      }

      if (!venue.payoutEmail || !venue.accountHolder) {
        throw new Response("La cancha debe completar sus datos de liquidación antes de procesar pagos.", { status: 503 });
      }

      const provider: PaymentProvider = (venue.paymentProvider as PaymentProvider) ?? "MP";
      let flowCredentials: FlowCredentials | null = null;

      if (provider === "MP") {
        const providers = getEnabledProviders();
        if (!providers.MP) {
          throw new Response("Mercado Pago no está configurado.", { status: 503 });
        }
        if (!venue.mpAccessToken) {
          throw new Response("La cancha debe conectar Mercado Pago para recibir el pago.", { status: 503 });
        }
        if (!venue.mpCollectorId || !venue.mpAccountType) {
          throw new Response("La cancha debe completar sus datos de Mercado Pago antes de procesar pagos.", { status: 503 });
        }
      } else if (provider === "FLOW") {
        const context = `venue:${venue.id}`;
        const apiKey = decryptSecret(venue.flowApiKey, { context });
        const secret = decryptSecret(venue.flowSecretKey, { context });
        if (!apiKey || !secret) {
          throw new Response("La cancha debe registrar sus credenciales de Flow para cobrar este partido.", { status: 503 });
        }
        const env: "PROD" | "SANDBOX" = (venue.flowEnv ?? "SANDBOX").toUpperCase() === "PROD" ? "PROD" : "SANDBOX";
        flowCredentials = { apiKey, secret, env };
      } else {
        throw new Response("El proveedor de pagos configurado en la cancha no es compatible.", { status: 503 });
      }

      const paidSpot = await tx.spot.findFirst({
        where: { matchId, userId, status: "PAID" },
        select: { id: true },
      });
      if (paidSpot) {
        return { status: "already_paid" as const } satisfies TxResult;
      }

      let existingSpot = await tx.spot.findFirst({
        where: { matchId, userId },
        orderBy: { createdAt: "asc" },
        select: { id: true, status: true },
      });

      if (existingSpot && existingSpot.status === "CANCELED") {
        existingSpot = null;
      }

      let reservedSpot = existingSpot;
      if (!reservedSpot) {
        const availableSpot = await tx.spot.findFirst({
          where: { matchId, status: "AVAILABLE" },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
        if (!availableSpot) {
          throw new Response("Sin cupos disponibles", { status: 409 });
        }
        reservedSpot = await tx.spot.update({
          where: { id: availableSpot.id },
          data: {
            status: "RESERVED",
            userId,
            holdUntil: holdUntilTarget,
            team: requestedTeam ?? null,
            position: requestedPosition ?? null,
          },
          select: { id: true, holdUntil: true },
        });
      } else {
        reservedSpot = await tx.spot.update({
          where: { id: reservedSpot.id },
          data: {
            status: "RESERVED",
            userId,
            holdUntil: holdUntilTarget,
            team: requestedTeam ?? null,
            position: requestedPosition ?? null,
          },
          select: { id: true, holdUntil: true },
        });
      }

      const payment = await tx.payment.upsert({
        where: { spotId: reservedSpot.id },
        create: {
          userId,
          matchId,
          spotId: reservedSpot.id,
          amountCLP: match.pricePerSpot ?? 0,
          provider,
          status: "PENDING",
          team: requestedTeam ?? null,
          position: requestedPosition ?? null,
        },
        update: {
          amountCLP: match.pricePerSpot ?? 0,
          provider,
          status: "PENDING",
          providerRef: null,
          team: requestedTeam ?? null,
          position: requestedPosition ?? null,
        },
        select: { id: true, amountCLP: true, spotId: true },
      });

      const remaining = await tx.spot.count({ where: { matchId, status: "AVAILABLE" } });
      if (remaining === 0) {
        await tx.match.update({ where: { id: matchId }, data: { status: "FULL" } }).catch(() => null);
      } else {
        await tx.match.update({ where: { id: matchId }, data: { status: "PUBLISHED" } }).catch(() => null);
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { email: true, profile: { select: { name: true } } },
      });

      return {
        status: "pending_payment" as const,
        match: { id: match.id, title: match.title, comuna: match.comuna, venueId: match.venueId },
        payment,
        holdUntil: reservedSpot.holdUntil ?? holdUntilTarget,
        user: { email: user?.email ?? null, name: user?.profile?.name ?? null },
        provider,
        flowCredentials,
      } satisfies TxResult;
    })) as TxResult;

    if (txResult.status === "free") {
      return NextResponse.json(
        { error: "Este partido no requiere pago en línea." },
        { status: 400 },
      );
    }

    if (txResult.status === "already_paid") {
      return NextResponse.json({
        ok: true,
        alreadyJoined: true,
        message: "Ya tienes un cupo pagado en este partido.",
      });
    }

    const baseUrl = resolveBaseUrl(req);
    try {
      const initResult = await initPaymentSession({
        provider: txResult.provider,
        payment: { id: txResult.payment.id, amountCLP: txResult.payment.amountCLP, spotId: txResult.payment.spotId },
        match: {
          id: txResult.match.id,
          title: txResult.match.title,
          comuna: txResult.match.comuna,
          venueId: txResult.match.venueId ?? null,
        },
        baseUrl,
        user: { email: txResult.user.email, name: txResult.user.name ?? undefined },
        venue: {
          id: txResult.match.venueId ?? null,
          flow: txResult.flowCredentials ?? undefined,
        },
      });

      if (!initResult.url) {
        throw new Error("El proveedor de pago no entregó una URL válida");
      }

      await prisma.payment.update({
        where: { id: txResult.payment.id },
        data: { providerRef: initResult.providerRef },
      }).catch(() => null);

      return NextResponse.json({
        ok: true,
        redirectUrl: initResult.url,
        paymentId: txResult.payment.id,
        providerRef: initResult.providerRef,
        expiresAt: txResult.holdUntil?.toISOString?.() ?? null,
      });
    } catch (err) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: txResult.payment.id },
          data: { status: "REJECTED" },
        }).catch(() => null);
        await tx.spot.update({
          where: { id: txResult.payment.spotId },
          data: { status: "AVAILABLE", userId: null, holdUntil: null, team: null, position: null },
        }).catch(() => null);
      });
      throw err;
    }
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("checkout:error", err);
    return NextResponse.json(
      { error: err?.message ?? "No se pudo iniciar el pago" },
      { status: 500 },
    );
  }
}
