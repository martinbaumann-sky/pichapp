import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { VENUE_PLANS } from "@/lib/venuePlans";

export async function GET() {
  try {
    const userId = await requireUserId();
    const venue = await prisma.venue.findFirst({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        plan: true,
        payoutEmail: true,
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!venue) {
      return NextResponse.json({ error: "No tienes una cancha registrada" }, { status: 404 });
    }

    const plans = VENUE_PLANS;
    return NextResponse.json({ venue, plans });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[venue/plans/status]", err);
    return NextResponse.json({ error: "No pudimos cargar la facturación" }, { status: 500 });
  }
}
