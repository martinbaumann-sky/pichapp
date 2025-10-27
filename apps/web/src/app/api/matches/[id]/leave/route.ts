import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id: matchId } = await params;
    if (!matchId) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const match = await prisma.match.findUnique({ where: { id: matchId }, select: { startsAt: true } });
    if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });

    // Regla: solo permite bajarse hasta 2 horas antes del inicio
    const startsAt = match.startsAt ? new Date(match.startsAt) : null;
    if (startsAt) {
      const msUntilStart = startsAt.getTime() - Date.now();
      const cutoffMs = 2 * 60 * 60 * 1000;
      if (msUntilStart < cutoffMs) {
        return NextResponse.json({ error: "Ya no puedes bajarte del partido. Faltan menos de 2 horas." }, { status: 403 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const guestInvites = typeof (tx as any)?.guestInvite?.findMany === "function"
        ? await (tx as any).guestInvite.findMany({
            where: { matchId, inviterId: userId },
            select: { id: true, spotId: true, guestUserId: true },
          })
        : [] as Array<{ id: string; spotId: string; guestUserId: string | null }>;

      const guestSpotIds = guestInvites.map((invite) => invite.spotId).filter(Boolean);

      const orConditions: any[] = [{ userId }];
      if (guestSpotIds.length > 0) {
        orConditions.push({ id: { in: guestSpotIds } });
      }

      const spots = await tx.spot.findMany({
        where: {
          matchId,
          status: { in: ["PAID", "RESERVED"] },
          OR: orConditions,
        },
        select: { id: true, userId: true },
      });

      if (spots.length === 0) {
        return { released: 0, viewerSpots: 0, guestSpots: 0 };
      }

      let viewerSpots = 0;
      let guestSpots = 0;

      const inviteBySpotId = new Map<string, { id: string; guestUserId: string | null }>();
      for (const invite of guestInvites) {
        if (!invite?.spotId) continue;
        inviteBySpotId.set(invite.spotId, { id: invite.id, guestUserId: invite.guestUserId });
      }

      for (const spot of spots) {
        if (spot.userId === userId) viewerSpots += 1;
        const invite = inviteBySpotId.get(spot.id);
        if (invite) guestSpots += 1;

        await tx.spot.update({
          where: { id: spot.id },
          data: { status: "AVAILABLE", userId: null, team: null, position: null, holdUntil: null },
        });

        if (invite) {
          if (typeof (tx as any)?.guestInvite?.delete === "function") {
            await (tx as any).guestInvite.delete({ where: { id: invite.id } }).catch(() => null);
          }
          // No eliminamos al usuario invitado, solo su invitación y liberamos su cupo
        }
      }

      const available = await tx.spot.count({ where: { matchId, status: "AVAILABLE" } });
      await tx.match
        .update({ where: { id: matchId }, data: { status: available > 0 ? "PUBLISHED" : "FULL" } })
        .catch(() => null);

      return { released: spots.length, viewerSpots, guestSpots };
    });

    const parts: string[] = [];
    if (result.viewerSpots > 0) {
      parts.push(
        result.viewerSpots === 1
          ? "Se liberó tu cupo"
          : `Se liberaron ${result.viewerSpots} cupos tuyos`,
      );
    }
    if (result.guestSpots > 0) {
      parts.push(
        result.guestSpots === 1
          ? "Se dio de baja a tu invitado"
          : `Se dieron de baja ${result.guestSpots} invitados`,
      );
    }

    const message = parts.length > 0 ? `${parts.join(". ")}.` : "No tenías cupos reservados en este partido.";

    return NextResponse.json({ ok: true, released: result.released, message });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err?.message ?? "No se pudo bajar del partido" }, { status: 500 });
  }
}


