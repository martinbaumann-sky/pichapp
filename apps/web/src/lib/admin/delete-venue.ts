// @ts-nocheck
type Prisma = any;

import { prisma } from "@/lib/db";
import { deleteMatchCascade } from "./match-tools";

type TransactionClient = Prisma.TransactionClient;

async function deleteVenueCascadeWithTx(tx: TransactionClient, venueId: string) {
  const matchIds = await tx.match
    .findMany({ where: { venueId }, select: { id: true } })
    .then((items) => items.map((item) => item.id));

  for (const matchId of matchIds) {
    await deleteMatchCascade(matchId, tx);
  }

  await tx.field.deleteMany({ where: { venueId } });
  await tx.venueSubscription.deleteMany({ where: { venueId } });
  await tx.venue.delete({ where: { id: venueId } });
}

export async function deleteVenueCascade(venueId: string, client?: Prisma.TransactionClient) {
  if (client) {
    await deleteVenueCascadeWithTx(client, venueId);
  } else {
    await prisma.$transaction(async (tx) => {
      await deleteVenueCascadeWithTx(tx, venueId);
    });
  }
}

