import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await request.json().catch(() => ({}));
    const requestedVenueId = typeof body?.venueId === "string" ? body.venueId : null;

    const venue = await prisma.venue.findFirst({
      where: requestedVenueId ? { id: requestedVenueId, ownerId: userId } : { ownerId: userId },
      select: { id: true },
    });

    if (!venue) {
      return NextResponse.json({ error: "No encontramos una cancha asociada" }, { status: 404 });
    }

    await prisma.venue.update({
      where: { id: venue.id },
      data: {
        mpAccountId: null,
        mpAccessToken: null,
        mpRefreshToken: null,
        mpTokenExpiresAt: null,
        mpUserId: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[venue/mp/disconnect]", error);
    return NextResponse.json({ error: "No pudimos desconectar Mercado Pago" }, { status: 500 });
  }
}
