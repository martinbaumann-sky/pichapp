import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { deletePasswordHash } from "@/lib/auth-password";
import { deleteMatchCascade } from "./match-tools";
import { deleteVenueCascade } from "./delete-venue";

type TransactionClient = Prisma.TransactionClient;

async function deleteUserCascadeWithTx(tx: TransactionClient, userId: string) {
  const matchIds = await tx.match
    .findMany({ where: { organizerId: userId }, select: { id: true } })
    .then((items) => items.map((item) => item.id));

  for (const matchId of matchIds) {
    await deleteMatchCascade(matchId, tx);
  }

  await tx.guestInvite.deleteMany({
    where: { OR: [{ inviterId: userId }, { guestUserId: userId }] },
  }).catch(() => null);

  await tx.waitlistEntry.deleteMany({ where: { userId } });
  await tx.message.deleteMany({ where: { senderId: userId } }).catch(() => null);
  await tx.friend.deleteMany({ where: { OR: [{ requesterId: userId }, { addresseeId: userId }] } });
  await tx.spot.updateMany({
    where: { userId },
    data: { userId: null, status: "AVAILABLE", team: null, position: null, holdUntil: null },
  });
  await tx.payment.deleteMany({ where: { userId } });
  await tx.organizerRating.deleteMany({ where: { OR: [{ organizerId: userId }, { raterId: userId }] } });
  await tx.playerRating.deleteMany({ where: { OR: [{ playerId: userId }, { raterId: userId }] } });
  await tx.emailVerification.deleteMany({ where: { userId } });
  await tx.session.deleteMany({ where: { userId } });
  await tx.oauthAccount.deleteMany({ where: { userId } });
  await tx.localPassword.deleteMany({ where: { userId } }).catch(() => null);
  await tx.profile.deleteMany({ where: { userId } });
  const venueIds = await tx.venue
    .findMany({ where: { ownerId: userId }, select: { id: true } })
    .then((items) => items.map((item) => item.id));

  for (const venueId of venueIds) {
    await deleteVenueCascade(venueId, tx);
  }

  await tx.user.delete({ where: { id: userId } });
}

export async function deleteUserCascade(userId: string, client?: Prisma.TransactionClient) {
  if (client) {
    await deleteUserCascadeWithTx(client, userId);
  } else {
    await prisma.$transaction(async (tx) => {
      await deleteUserCascadeWithTx(tx, userId);
    });
  }

  await deletePasswordHash(userId).catch(() => null);
}

