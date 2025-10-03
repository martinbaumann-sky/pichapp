import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { VENUE_PLANS, getVenuePlan } from "@/lib/venuePlans";
import { cancelPreapproval, createPreapproval } from "@/lib/mp/subscription";

function getBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (fromEnv) {
    try {
      const url = new URL(fromEnv);
      return url.origin;
    } catch (err) {
      console.warn("[venue/plans/checkout] invalid NEXT_PUBLIC_BASE_URL", fromEnv, err);
    }
  }
  return "http://localhost:3000";
}

function getNotificationUrl(baseUrl: string) {
  const envUrl = process.env.MP_WEBHOOK_URL?.trim();
  if (envUrl) return envUrl;
  return `${baseUrl.replace(/\/$/, "")}/api/mp/webhook`;
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const payload = (await req.json().catch(() => ({}))) as { plan?: string; returnUrl?: string | null };
    const planSlug = payload?.plan ? payload.plan.toLowerCase() : null;
    const plan = planSlug ? getVenuePlan(planSlug) : null;
    if (!plan) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    const venue = await prisma.venue.findFirst({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        plan: true,
        payoutEmail: true,
        mpCollectorId: true,
        mpAccountType: true,
      },
    });

    if (!venue) {
      return NextResponse.json({ error: "No tienes una cancha registrada" }, { status: 404 });
    }

    const baseUrl = getBaseUrl();
    const dashboardUrl = `${baseUrl}/panel/cancha?tab=billing`;

    if (plan.slug === "gratis") {
      const activeSub = await prisma.venueSubscription.findFirst({
        where: { venueId: venue.id, status: { in: ["ACTIVE", "PAUSED"] } },
      });
      if (activeSub?.mpPreapprovalId) {
        try {
          await cancelPreapproval(activeSub.mpPreapprovalId);
        } catch (err) {
          console.error("[venue/plans/checkout] cancel preapproval", err);
        }
        await prisma.venueSubscription.update({
          where: { id: activeSub.id },
          data: { status: "CANCELED", canceledAt: new Date(), cancellationReason: "Cambio a plan gratis" },
        });
      }

      await prisma.venue.update({ where: { id: venue.id }, data: { plan: "gratis" } });
      return NextResponse.json({ ok: true, checkoutUrl: null, plan: VENUE_PLANS.gratis, redirectUrl: dashboardUrl });
    }

    if (!venue.mpCollectorId || !venue.mpAccountType) {
      return NextResponse.json(
        {
          error: "Completa el Collector ID y tipo de cuenta de Mercado Pago en tu perfil antes de contratar un plan pagado.",
        },
        { status: 400 },
      );
    }

    if (!venue.payoutEmail) {
      return NextResponse.json(
        { error: "Define un correo de facturación en tu perfil antes de contratar un plan." },
        { status: 400 },
      );
    }

    const existingPending = await prisma.venueSubscription.findFirst({
      where: {
        venueId: venue.id,
        status: { in: ["PENDING"] },
        plan: plan.slug,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingPending?.initPoint && existingPending.mpPreapprovalId) {
      return NextResponse.json({
        ok: true,
        checkoutUrl: existingPending.initPoint,
        plan,
        pending: true,
      });
    }

    const externalReference = `venue:${venue.id}:plan:${plan.slug}:${Date.now()}`;
    const backUrl = payload?.returnUrl?.trim() || dashboardUrl;

    const preapproval = await createPreapproval({
      payerEmail: venue.payoutEmail,
      reason: plan.mpReason,
      externalReference,
      backUrl,
      priceCLP: plan.monthlyPriceCLP,
      notificationUrl: getNotificationUrl(baseUrl),
    });

    const subscription = await prisma.venueSubscription.create({
      data: {
        venueId: venue.id,
        plan: plan.slug,
        status: "PENDING",
        mpPreapprovalId: preapproval.id,
        externalReference,
        initPoint: preapproval.initPoint,
        backUrl,
        nextChargeAt: preapproval.nextPaymentDate ? new Date(preapproval.nextPaymentDate) : null,
        lastChargeAt: preapproval.lastChargedDate ? new Date(preapproval.lastChargedDate) : null,
      },
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl: subscription.initPoint,
      plan,
      subscriptionId: subscription.id,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[venue/plans/checkout]", err);
    return NextResponse.json({ error: "No pudimos iniciar el pago" }, { status: 500 });
  }
}
