import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { cancelPreapproval } from "@/lib/mp/subscription";
import { sendVenuePlanCancelledEmail } from "@/lib/venue-subscription-email";
import { getVenuePlan } from "@/lib/venuePlans";

function getDashboardUrl() {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (base) {
    try {
      const url = new URL(base);
      return `${url.origin}/panel/cancha?tab=billing`;
    } catch {}
  }
  return "http://localhost:3000/panel/cancha?tab=billing";
}

export async function POST() {
  try {
    const userId = await requireUserId();
    const venue = await prisma.venue.findFirst({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        payoutEmail: true,
        plan: true,
        owner: { select: { email: true } },
        subscriptions: {
          where: { status: { in: ["ACTIVE", "PAUSED"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!venue) {
      return NextResponse.json({ error: "No tienes una cancha registrada" }, { status: 404 });
    }

    const subscription = venue.subscriptions[0];
    if (!subscription) {
      return NextResponse.json({ error: "No hay una suscripción activa" }, { status: 400 });
    }

    if (subscription.mpPreapprovalId) {
      try {
        await cancelPreapproval(subscription.mpPreapprovalId);
      } catch (err) {
        console.error("[venue/plans/cancel] cancel preapproval", err);
      }
    }

    await prisma.$transaction([
      prisma.venueSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "CANCELED",
          canceledAt: new Date(),
          cancellationReason: "Cancelado desde panel",
        },
      }),
      prisma.venue.update({ where: { id: venue.id }, data: { plan: "gratis" } }),
    ]);

    const toEmail = venue.owner.email || venue.payoutEmail;
    const normalizedPlan = getVenuePlan(subscription.plan)?.slug ?? "gratis";
    if (toEmail && normalizedPlan !== "gratis") {
      await sendVenuePlanCancelledEmail({
        to: toEmail,
        venueName: venue.name,
        plan: normalizedPlan,
        dashboardUrl: getDashboardUrl(),
      }).catch((err) => console.warn("[venue/plans/cancel] email", err));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[venue/plans/cancel]", err);
    return NextResponse.json({ error: "No pudimos cancelar la suscripción" }, { status: 500 });
  }
}
