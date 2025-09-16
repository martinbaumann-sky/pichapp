import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { confirmFreeSpot } from "@/lib/freeReservations";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: { id: string } } | { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const p: any = (ctx as any)?.params;
    const { id: matchId } = (p && typeof p.then === "function") ? await p : p;

    const body = await req.json().catch(() => ({}));
    const team = body?.team ?? null;
    const position = body?.position ?? null;

    const result = await confirmFreeSpot({ matchId, userId, team, position });

    return NextResponse.json(
      {
        ok: true,
        spotId: result.spotId,
        alreadyJoined: result.alreadyJoined,
        remainingSpots: result.remainingSpots,
        message: "Reservas gratis habilitadas. Tu cupo está confirmado.",
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err?.message ?? "No se pudo reservar cupo" }, { status: 500 });
  }
}
