import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { confirmFreeSpot } from "@/lib/freeReservations";
import { prisma } from "@/lib/db";
import { normalizeTeam } from "@/lib/teams";
import { sanitizePosition } from "@/lib/teamAssignment";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, ctx: { params: { id: string } } | { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const p: any = (ctx as any)?.params;
    const { id: matchId } = (p && typeof p.then === "function") ? await p : p;

    const body = await req.json().catch(() => ({}));
    const team = body?.team ?? null;
    const position = body?.position ?? null;
    const rawFriends = Array.isArray(body?.friends) ? body.friends : [];
    const trimmedFriends = rawFriends.slice(0, 6);

    const sanitizedFriends: Array<{
      name: string;
      email: string;
      team: string | null;
      position: string | null;
    }> = [];

    for (let i = 0; i < trimmedFriends.length; i += 1) {
      const friend = trimmedFriends[i];
      if (!friend || typeof friend !== "object") continue;
      const name = String(friend.name ?? "").trim();
      const email = String(friend.email ?? "").trim().toLowerCase();
      if (!name || !email || !EMAIL_REGEX.test(email)) {
        return NextResponse.json(
          { error: "Completa nombre y correo válido para cada invitado." },
          { status: 400 }
        );
      }
      const normalizedTeam = normalizeTeam(friend.team ?? null);
      const normalizedPosition = sanitizePosition(friend.position ?? null);
      if (!normalizedPosition) {
        return NextResponse.json(
          { error: "Selecciona una posición para cada invitado." },
          { status: 400 }
        );
      }
      sanitizedFriends.push({
        name,
        email,
        team: normalizedTeam,
        position: normalizedPosition,
      });
    }

    const result = await confirmFreeSpot({ matchId, userId, team, position });

    if (sanitizedFriends.length > result.remainingSpots) {
      return NextResponse.json(
        { error: "No hay suficientes cupos disponibles para tus invitados." },
        { status: 409 }
      );
    }

    const match = await prisma.match.findUnique({ where: { id: matchId }, select: { comuna: true } }).catch(() => null);
    const defaultComuna = match?.comuna ?? "";

    let remainingSpots = result.remainingSpots;
    const invitedSummaries: Array<{ spotId: string }> = [];

    for (const friend of sanitizedFriends) {
      const friendUser = await prisma.user.create({
        data: {
          email: null,
          isAdmin: false,
          role: "PLAYER",
        },
      });

      await prisma.profile.create({
        data: {
          userId: friendUser.id,
          name: friend.name,
          phone: "56900000000",
          comuna: defaultComuna,
          position: friend.position as any,
        },
      }).catch(() => null);

      try {
        const friendResult = await confirmFreeSpot({
          matchId,
          userId: friendUser.id,
          team: friend.team,
          position: friend.position,
        });
        remainingSpots = friendResult.remainingSpots;
        invitedSummaries.push({ spotId: friendResult.spotId });
        await prisma.guestInvite.create({
          data: {
            matchId,
            inviterId: userId,
            spotId: friendResult.spotId,
            guestUserId: friendUser.id,
            name: friend.name,
            email: friend.email,
            position: friend.position as any,
          },
        }).catch(() => null);
      } catch (err) {
        await prisma.profile.deleteMany({ where: { userId: friendUser.id } }).catch(() => null);
        await prisma.user.delete({ where: { id: friendUser.id } }).catch(() => null);
        if (err instanceof Response) throw err;
        throw err;
      }
    }

    const invitedCount = invitedSummaries.length;
    const baseMessage = result.alreadyJoined ? "Ya estabas inscrito en este partido." : "Cupo confirmado. No necesitas pagar.";
    const inviteMessage = invitedCount > 0 ? ` Reservaste ${invitedCount} invitado${invitedCount === 1 ? "" : "s"}.` : "";

    return NextResponse.json(
      {
        ok: true,
        spotId: result.spotId,
        alreadyJoined: result.alreadyJoined,
        remainingSpots,
        invited: invitedCount,
        message: `${baseMessage}${inviteMessage}`.trim(),
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: err?.message ?? "No se pudo reservar cupo" }, { status: 500 });
  }
}
