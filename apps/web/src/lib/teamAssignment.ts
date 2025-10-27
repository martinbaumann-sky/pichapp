import type { Prisma } from "@prisma/client";
import { computeTeamCapacities, normalizePosition, normalizeTeam, type PositionKey, type TeamKey } from "@/lib/teams";

export type TeamAssignmentOptions = {
  requestedTeam?: string | null;
  ignoreSpotId?: string | null;
};

export async function resolveTeamForUser(
  tx: Prisma.TransactionClient,
  matchId: string,
  userId: string,
  options: TeamAssignmentOptions = {}
): Promise<TeamKey | null> {
  const requestedTeam = normalizeTeam(options.requestedTeam ?? null);
  const match = await tx.match.findUnique({ where: { id: matchId }, select: { totalSpots: true } });
  if (!match) return null;

  const capacities = computeTeamCapacities(match.totalSpots ?? 0);

  const spots = await tx.spot.findMany({
    where: {
      matchId,
      status: { in: ["PAID", "RESERVED"] },
      ...(options.ignoreSpotId ? { NOT: { id: options.ignoreSpotId } } : {}),
    },
    select: { userId: true, team: true },
  });

  const teamCount = spots.reduce(
    (acc, spot) => {
      const team = normalizeTeam(spot.team);
      if (team === "CLARO") acc.claro += 1;
      if (team === "OSCURO") acc.oscuro += 1;
      return acc;
    },
    { claro: 0, oscuro: 0 }
  );

  const canTake = (team: TeamKey) => {
    if (team === "CLARO") return teamCount.claro < capacities.claro;
    return teamCount.oscuro < capacities.oscuro;
  };

  if (requestedTeam && canTake(requestedTeam)) {
    return requestedTeam;
  }

  const friends = await tx.friend.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: userId },
        { addresseeId: userId },
      ],
    },
    select: { requesterId: true, addresseeId: true },
  });
  const friendIds = new Set<string>();
  for (const f of friends) {
    if (f.requesterId !== userId) friendIds.add(f.requesterId);
    if (f.addresseeId !== userId) friendIds.add(f.addresseeId);
  }
  if (friendIds.size > 0) {
    for (const spot of spots) {
      if (!spot.userId) continue;
      if (!friendIds.has(spot.userId)) continue;
      const friendTeam = normalizeTeam(spot.team);
      if (friendTeam && canTake(friendTeam)) {
        return friendTeam;
      }
    }
  }

  if (canTake("CLARO") && teamCount.claro <= teamCount.oscuro) return "CLARO";
  if (canTake("OSCURO")) return "OSCURO";
  if (canTake("CLARO")) return "CLARO";
  return null;
}

export function sanitizePosition(value: unknown): PositionKey | null {
  return normalizePosition(value);
}
