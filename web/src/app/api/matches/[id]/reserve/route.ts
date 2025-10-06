import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { confirmFreeSpot } from "@/lib/freeReservations";
import { prisma } from "@/lib/db";
import { isProfileIncomplete, PROFILE_COMPLETION_REQUIRED_MESSAGE } from "@/lib/profileCompletion";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: { id: string } } | { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const p: any = (ctx as any)?.params;
    const { id: matchId } = (p && typeof p.then === "function") ? await p : p;

    const body = await req.json().catch(() => ({}));
    const team = body?.team ?? null;
    const position = body?.position ?? null;

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

    const result = await confirmFreeSpot({ matchId, userId, team, position });

    return NextResponse.json(
      {
        ok: true,
        spotId: result.spotId,
        alreadyJoined: result.alreadyJoined,
        remainingSpots: result.remainingSpots,
        message: "Reservas gratis habilitadas. Tu cupo esta confirmado.",
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err?.message ?? "No se pudo reservar cupo" }, { status: 500 });
  }
}
