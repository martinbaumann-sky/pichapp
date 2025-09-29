import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await requireUserId();

    const rows = await prisma.$queryRaw<Array<{
      matchId: string;
      matchTitle: string;
      matchComuna: string | null;
      startsAt: Date;
      isOrganizer: boolean;
      lastMessage: string | null;
      lastMessageAt: Date | null;
      lastSenderId: string | null;
    }>>(Prisma.sql`
      SELECT
        m."id"        AS "matchId",
        m."title"     AS "matchTitle",
        m."comuna"    AS "matchComuna",
        m."startsAt"  AS "startsAt",
        (m."organizerId" = ${userId})::boolean AS "isOrganizer",
        lm."text"      AS "lastMessage",
        lm."createdAt" AS "lastMessageAt",
        lm."senderId"  AS "lastSenderId"
      FROM "Match" m
      JOIN LATERAL (
        SELECT msg."text", msg."createdAt", msg."senderId"
        FROM "Message" msg
        WHERE msg."matchId" = m."id"
        ORDER BY msg."createdAt" DESC
        LIMIT 1
      ) lm ON true
      WHERE
        m."organizerId" = ${userId}
        OR EXISTS (
          SELECT 1 FROM "Spot" s
          WHERE s."matchId" = m."id"
            AND s."userId" = ${userId}
            AND s."status" IN ('PAID','RESERVED')
        )
      ORDER BY lm."createdAt" DESC
      LIMIT 40
    `);

    const senderIds = Array.from(
      new Set(rows.map((row) => row.lastSenderId).filter((value): value is string => Boolean(value)))
    );

    const profiles = senderIds.length
      ? await prisma.profile.findMany({
          where: { userId: { in: senderIds } },
          select: { userId: true, name: true },
        })
      : [];

    const profileById = new Map(profiles.map((profile) => [profile.userId, profile.name] as const));

    return NextResponse.json({
      threads: rows.map((row) => ({
        matchId: row.matchId,
        title: row.matchTitle,
        comuna: row.matchComuna,
        startsAt: row.startsAt,
        isOrganizer: row.isOrganizer,
        lastMessage: row.lastMessage,
        lastMessageAt: row.lastMessageAt,
        lastSenderName: row.lastSenderId ? profileById.get(row.lastSenderId) ?? null : null,
      })),
    });
  } catch (error: any) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error?.message || "No se pudo listar tus mensajes" }, { status: 500 });
  }
}
