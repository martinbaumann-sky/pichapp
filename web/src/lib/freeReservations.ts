import { prisma } from "@/lib/db";

const allowedPositions = new Set(["ARQUERO", "DEFENSA", "LATERAL", "VOLANTE", "DELANTERO"]);
const teamMap: Record<string, "CLARO" | "OSCURO"> = {
  CLARO: "CLARO",
  LIGHT: "CLARO",
  OSCURO: "OSCURO",
  OSCURA: "OSCURO",
  DARK: "OSCURO",
};

function normalizeTeam(team: unknown) {
  if (!team) return null;
  const value = String(team).trim().toUpperCase();
  return teamMap[value] ?? null;
}

function normalizePosition(position: unknown) {
  if (!position) return null;
  const upper = String(position).trim().toUpperCase();
  return allowedPositions.has(upper) ? (upper as any) : null;
}

export type FreeReservationResult = {
  spotId: string;
  remainingSpots: number;
  alreadyJoined: boolean;
};

export async function confirmFreeSpot(params: { matchId: string; userId: string; team?: string | null; position?: string | null }): Promise<FreeReservationResult> {
  const team = normalizeTeam(params.team);
  const position = normalizePosition(params.position);
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
      const updated = await tx.spot.update({
        where: { id: existing.id },
        data: {
          status: "PAID",
          holdUntil: null,
          team: team ?? existing.team ?? null,
          position: position ?? existing.position ?? null,
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
      const updated = await tx.spot.updateMany({
        where: { id: candidate.id, status: "AVAILABLE" },
        data: {
          status: "PAID",
          userId,
          holdUntil: null,
          team: team ?? null,
          position: position ?? null,
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
