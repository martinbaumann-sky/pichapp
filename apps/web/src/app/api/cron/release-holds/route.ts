import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const now = new Date();
    const expired = await prisma.spot.findMany({
      where: { status: "RESERVED", holdUntil: { lt: now } },
      select: { id: true, matchId: true },
    });

    const matchIds = new Set<string>();

    await prisma.$transaction(async (tx: any) => {
      for (const s of expired) {
        await tx.spot.update({
          where: { id: s.id },
          data: { status: "AVAILABLE", userId: null, holdUntil: null },
        });
        matchIds.add(s.matchId);
      }
    });

    return NextResponse.json({ released: expired.length, matches: Array.from(matchIds) });
  } catch (err) {
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
}
