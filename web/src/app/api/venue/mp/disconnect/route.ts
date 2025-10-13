import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

export async function POST() {
  try {
    const userId = await requireUserId();
    const venue = await prisma.venue.findFirst({ where: { ownerId: userId } });
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
