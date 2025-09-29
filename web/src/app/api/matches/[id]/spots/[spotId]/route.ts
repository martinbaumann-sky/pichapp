import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { resolveTeamForUser, sanitizePosition } from "@/lib/teamAssignment";
import { normalizeTeam } from "@/lib/teams";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; spotId: string }> },
) {
  try {
    const actorId = await requireUserId();
    const { id: matchId, spotId } = await params;

    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      select: {
        id: true,
        matchId: true,
        userId: true,
        status: true,
        team: true,
        position: true,
        match: { select: { organizerId: true } },
      },
    });

    if (!spot || spot.matchId !== matchId) {
      return NextResponse.json({ error: "Cupo no encontrado" }, { status: 404 });
    }

    const actor = await prisma.user
      .findUnique({ where: { id: actorId }, select: { isAdmin: true, role: true } })
      .catch(() => null);
    const isOrganizer = spot.match.organizerId === actorId;
    const isSelf = spot.userId === actorId;
    const isAdmin = !!actor && (actor.isAdmin || actor.role === "SUPERADMIN");

    if (!isSelf && !isOrganizer && !isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const hasTeam = Object.prototype.hasOwnProperty.call(body, "team");
    const hasPosition = Object.prototype.hasOwnProperty.call(body, "position");

    if (!hasTeam && !hasPosition) {
      return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
    }

    const targetUserId = spot.userId ?? actorId;

    return await prisma.$transaction(async (tx) => {
      const freshSpot = await tx.spot.findUnique({
        where: { id: spotId },
        select: { userId: true, team: true, position: true },
      });
      if (!freshSpot) {
        return NextResponse.json({ error: "Cupo no encontrado" }, { status: 404 });
      }

      let nextTeam = normalizeTeam(freshSpot.team);
      if (hasTeam) {
        const requestedTeam = normalizeTeam(body.team ?? null);
        const resolvedTeam = await resolveTeamForUser(tx, matchId, targetUserId, {
          requestedTeam: requestedTeam ?? null,
          ignoreSpotId: spotId,
        });
        if (requestedTeam && resolvedTeam !== requestedTeam) {
          return NextResponse.json({ error: "Ese equipo ya no tiene cupos" }, { status: 409 });
        }
        nextTeam = resolvedTeam ?? requestedTeam ?? nextTeam ?? null;
      }

      let nextPosition = freshSpot.position ?? null;
      if (hasPosition) {
        nextPosition = sanitizePosition(body.position ?? null) ?? null;
      }

      const updated = await tx.spot.update({
        where: { id: spotId },
        data: {
          team: nextTeam,
          position: nextPosition,
        },
        select: { id: true, team: true, position: true },
      });

      return NextResponse.json({
        ok: true,
        spotId: updated.id,
        team: updated.team,
        position: updated.position,
      });
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err?.message ?? "No se pudo actualizar" }, { status: 500 });
  }
}
