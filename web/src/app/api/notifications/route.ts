import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

interface NotificationItem {
  id: string;
  type:
    | "friend_request_incoming"
    | "friend_request_accepted"
    | "match_starting_player"
    | "match_starting_organizer"
    | "match_full_player"
    | "match_full_organizer"
    | "waitlist_invite";
  title: string;
  description: string;
  href: string;
  createdAt: string;
}

const toName = (name?: string | null, email?: string | null) => {
  const trimmed = (name ?? "").trim();
  if (trimmed.length > 0) return trimmed;
  if (email && email.length > 0) return email;
  return "Jugador";
};

export async function GET() {
  try {
    const userId = await requireUserId();
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [pendingRequests, acceptedRequests, organizerSoonMatches, playerSoonSpots, organizerFullMatches, playerFullMatches, waitlistInvites] =
      await Promise.all([
        prisma.friend.findMany({
          where: { addresseeId: userId, status: "PENDING" },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            createdAt: true,
            requester: {
              select: {
                id: true,
                email: true,
                profile: { select: { name: true } },
              },
            },
          },
        }),
        prisma.friend.findMany({
          where: { requesterId: userId, status: "ACCEPTED", updatedAt: { gte: sevenDaysAgo } },
          orderBy: { updatedAt: "desc" },
          take: 10,
          select: {
            id: true,
            updatedAt: true,
            addressee: {
              select: {
                id: true,
                email: true,
                profile: { select: { name: true } },
              },
            },
          },
        }),
        prisma.match.findMany({
          where: {
            organizerId: userId,
            startsAt: { gte: now, lte: oneHourLater },
            status: { in: ["PUBLISHED", "FULL"] },
          },
          orderBy: { startsAt: "asc" },
          take: 5,
          select: {
            id: true,
            title: true,
            comuna: true,
            startsAt: true,
          },
        }),
        prisma.spot.findMany({
          where: {
            userId,
            status: "PAID",
            match: {
              startsAt: { gte: now, lte: oneHourLater },
              status: { in: ["PUBLISHED", "FULL"] },
            },
          },
          orderBy: { match: { startsAt: "asc" } },
          take: 5,
          select: {
            id: true,
            match: {
              select: {
                id: true,
                title: true,
                comuna: true,
                startsAt: true,
              },
            },
          },
        }),
        prisma.match.findMany({
          where: {
            organizerId: userId,
            status: "FULL",
            startsAt: { gt: now },
          },
          orderBy: { startsAt: "asc" },
          take: 10,
          select: {
            id: true,
            title: true,
            comuna: true,
            startsAt: true,
            spots: {
              where: { status: "PAID" },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { createdAt: true },
            },
          },
        }),
        prisma.match.findMany({
          where: {
            status: "FULL",
            startsAt: { gt: now },
            spots: { some: { userId, status: "PAID" } },
          },
          orderBy: { startsAt: "asc" },
          take: 10,
          select: {
            id: true,
            title: true,
            comuna: true,
            startsAt: true,
            spots: {
              where: { status: "PAID" },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { createdAt: true },
            },
          },
        }),
        prisma.waitlistEntry.findMany({
          where: {
            userId,
            status: "INVITED",
          },
          orderBy: { invitedAt: "desc" },
          take: 10,
          select: {
            id: true,
            invitedAt: true,
            match: {
              select: {
                id: true,
                title: true,
                comuna: true,
                startsAt: true,
              },
            },
          },
        }),
      ]);

    const items: NotificationItem[] = [];

    for (const req of pendingRequests) {
      const name = toName(req.requester?.profile?.name, req.requester?.email);
      items.push({
        id: `friend-request-${req.id}`,
        type: "friend_request_incoming",
        title: "Nueva solicitud de amistad",
        description: `${name} quiere agregarte`,
        href: "/amigos",
        createdAt: req.createdAt.toISOString(),
      });
    }

    for (const req of acceptedRequests) {
      const name = toName(req.addressee?.profile?.name, req.addressee?.email);
      items.push({
        id: `friend-accepted-${req.id}`,
        type: "friend_request_accepted",
        title: "Solicitud aceptada",
        description: `${name} acepto tu solicitud de amistad`,
        href: "/amigos",
        createdAt: req.updatedAt.toISOString(),
      });
    }

    const soonMatchIds = new Set<string>();
    for (const match of organizerSoonMatches) {
      soonMatchIds.add(match.id);
      items.push({
        id: `match-soon-org-${match.id}`,
        type: "match_starting_organizer",
        title: "Tu partido que organizas comienza en 1 hora",
        description: `${match.title} en ${match.comuna}`,
        href: `/partido/${match.id}`,
        createdAt: match.startsAt.toISOString(),
      });
    }

    for (const spot of playerSoonSpots) {
      const match = spot.match;
      if (!match) continue;
      if (soonMatchIds.has(match.id)) continue;
      soonMatchIds.add(match.id);
      items.push({
        id: `match-soon-player-${match.id}`,
        type: "match_starting_player",
        title: "Tienes un partido en 1 hora",
        description: `${match.title} en ${match.comuna}`,
        href: `/partido/${match.id}`,
        createdAt: match.startsAt.toISOString(),
      });
    }

    const fullMatchIds = new Set<string>();
    for (const match of organizerFullMatches) {
      if (fullMatchIds.has(match.id)) continue;
      fullMatchIds.add(match.id);
      const filledAt = match.spots[0]?.createdAt ?? match.startsAt;
      items.push({
        id: `match-full-org-${match.id}`,
        type: "match_full_organizer",
        title: "Se lleno tu partido",
        description: `${match.title} ya no tiene cupos disponibles`,
        href: `/partido/${match.id}`,
        createdAt: filledAt.toISOString(),
      });
    }

    for (const match of playerFullMatches) {
      if (fullMatchIds.has(match.id)) continue;
      fullMatchIds.add(match.id);
      const filledAt = match.spots[0]?.createdAt ?? match.startsAt;
      items.push({
        id: `match-full-player-${match.id}`,
        type: "match_full_player",
        title: "El partido esta completo",
        description: `${match.title} ya tiene todos los cupos ocupados`,
        href: `/partido/${match.id}`,
        createdAt: filledAt.toISOString(),
      });
    }

    for (const invite of waitlistInvites) {
      if (!invite.match) continue;
      items.push({
        id: `waitlist-invite-${invite.id}`,
        type: "waitlist_invite",
        title: "Tienes un cupo disponible",
        description: `${invite.match.title} te invito a inscribirte`,
        href: `/partido/${invite.match.id}`,
        createdAt: (invite.invitedAt ?? now).toISOString(),
      });
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ items, unreadCount: items.length });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[GET /api/notifications]", err);
    return NextResponse.json({ error: "No autorizado o error de servidor" }, { status: 500 });
  }
}
