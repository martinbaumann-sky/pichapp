import type { Prisma, Match, Spot, PaymentStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

type TransactionClient = Prisma.TransactionClient;

type ClientLike = TransactionClient | typeof prisma;

function getClient(client?: ClientLike): ClientLike {
  return client ?? prisma;
}

export async function deleteMatchCascade(matchId: string, client?: ClientLike) {
  const db = getClient(client);

  await db.message.deleteMany({ where: { matchId } });
  await db.waitlistEntry.deleteMany({ where: { matchId } });
  await db.payment.deleteMany({ where: { matchId } });
  await db.organizerRating.deleteMany({ where: { matchId } });
  await db.playerRating.deleteMany({ where: { matchId } });
  await db.guestInvite.deleteMany({ where: { matchId } }).catch(() => null);
  await db.spot.deleteMany({ where: { matchId } });
  await db.match.delete({ where: { id: matchId } });
}

export async function rescheduleMatch(
  matchId: string,
  startsAt: Date,
  durationMins: number | null | undefined,
  client?: ClientLike,
): Promise<Match> {
  const db = getClient(client);
  return db.match.update({
    where: { id: matchId },
    data: {
      startsAt,
      ...(typeof durationMins === "number" && durationMins > 0 ? { durationMins } : {}),
    },
  });
}

export async function updateSpotAssignment(
  spotId: string,
  {
    team,
    position,
    status,
  }: {
    team?: string | null;
    position?: Spot["position"] | null;
    status?: Spot["status"] | null;
  },
  client?: ClientLike,
) {
  const db = getClient(client);
  const data: Partial<Spot> = {};
  if (team !== undefined) {
    (data as any).team = team;
  }
  if (position !== undefined) {
    (data as any).position = position;
  }
  if (status !== undefined && status) {
    (data as any).status = status;
  }
  if (Object.keys(data).length === 0) return;
  await db.spot.update({ where: { id: spotId }, data });
}

export async function removeSpotFromMatch(
  spotId: string,
  client?: ClientLike,
  options?: { paymentStatus?: PaymentStatus },
) {
  const db = getClient(client);
  await db.payment
    .updateMany({
      where: { spotId },
      data: { status: options?.paymentStatus ?? "REFUNDED", spotId: null },
    })
    .catch(() => null);

  await db.guestInvite.deleteMany({ where: { spotId } }).catch(() => null);

  await db.spot.update({
    where: { id: spotId },
    data: {
      status: "AVAILABLE",
      userId: null,
      team: null,
      position: null,
      holdUntil: null,
    },
  });
}

