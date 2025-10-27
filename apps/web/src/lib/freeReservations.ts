import { prisma } from "@/lib/db";
import { resolveTeamForUser, sanitizePosition } from "@/lib/teamAssignment";
import { normalizeTeam } from "@/lib/teams";

export type FreeReservationResult = {
  spotId: string;
  remainingSpots: number;
  alreadyJoined: boolean;
};

export async function confirmFreeSpot(params: { matchId: string; userId: string; team?: string | null; position?: string | null }): Promise<FreeReservationResult> {
  const requestedTeam = normalizeTeam(params.team ?? null);
  const requestedPosition = sanitizePosition(params.position ?? null);
  const { matchId, userId } = params;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.spot.findFirst({
      where: { matchId, userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, status: true, team: true, position: true },
    });

    if (existing && existing.status === "PAID") {
      const remaining = await tx.spot.count({ where: { matchId, status: "AVAILABLE" } });
      if (remaining === 0) {
        await tx.match.update({ where: { id: matchId }, data: { status: "FULL" } }).catch(() => null);
      }
      return { spotId: existing.id, remainingSpots: remaining, alreadyJoined: true };
    }

    if (existing && existing.status === "RESERVED") {
      const computedTeam = await resolveTeamForUser(tx, matchId, userId, {
        requestedTeam: requestedTeam ?? existing.team ?? null,
        ignoreSpotId: existing.id,
      });
      const finalTeam = (computedTeam ?? normalizeTeam(existing.team)) ?? null;
      const finalPosition = requestedPosition ?? existing.position ?? null;

      const updated = await tx.spot.update({
        where: { id: existing.id },
        data: {
          status: "PAID",
          holdUntil: null,
          team: finalTeam,
          position: finalPosition,
        },
        select: { id: true },
      });
      const remaining = await tx.spot.count({ where: { matchId, status: "AVAILABLE" } });
      if (remaining === 0) {
        await tx.match.update({ where: { id: matchId }, data: { status: "FULL" } }).catch(() => null);
      }
      return { spotId: updated.id, remainingSpots: remaining, alreadyJoined: true };
    }

    let acquiredSpotId: string | null = null;
    for (let i = 0; i < 3; i++) {
      const candidate = await tx.spot.findFirst({
        where: { matchId, status: "AVAILABLE" },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (!candidate) break;

      const assignedTeam = await resolveTeamForUser(tx, matchId, userId, { requestedTeam });
      const updated = await tx.spot.updateMany({
        where: { id: candidate.id, status: "AVAILABLE" },
        data: {
          status: "PAID",
          userId,
          holdUntil: null,
          team: assignedTeam,
          position: requestedPosition ?? null,
        },
      });
      if (updated.count > 0) {
        acquiredSpotId = candidate.id;
        break;
      }
    }

    if (!acquiredSpotId) {
      throw new Response("Sin cupos disponibles", { status: 409 });
    }

    const remaining = await tx.spot.count({ where: { matchId, status: "AVAILABLE" } });
    if (remaining === 0) {
      await tx.match.update({ where: { id: matchId }, data: { status: "FULL" } }).catch(() => null);
    } else {
      await tx.match.update({ where: { id: matchId }, data: { status: "PUBLISHED" } }).catch(() => null);
    }

    return { spotId: acquiredSpotId, remainingSpots: remaining, alreadyJoined: false };
  });
}
