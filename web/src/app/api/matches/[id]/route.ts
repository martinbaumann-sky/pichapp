import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streetViewUrl } from "@/lib/places";
import { buildStaticMapUrl } from "@/lib/maps";
import { getSessionUserId } from "@/lib/auth-core";
import { requireUserId } from "@/lib/auth";
import { resolveFriendship } from "@/lib/friendship";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: { id: string } } | { params: Promise<{ id: string }> },
) {
  try {
    const rawParams: any = (ctx as any)?.params ?? ctx;
    const resolved: any = typeof rawParams?.then === "function" ? await rawParams : rawParams;
    const id: string | undefined = resolved?.id ?? resolved?.params?.id;
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const match = await prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        organizerId: true,
        comuna: true,
        startsAt: true,
        durationMins: true,
        pricePerSpot: true,
        totalSpots: true,
        minSpotsToConfirm: true,
        level: true,
        venueName: true,
        venueAddress: true,
        lat: true,
        lng: true,
        coverImageUrl: true,
        organizer: { select: { id: true, profile: { select: { name: true } } } },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    const spots = await prisma.spot.findMany({
      where: { matchId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        status: true,
        userId: true,
        position: true,
        team: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, position: true } },
          },
        },
      },
    });

    const guestInvites =
      typeof (prisma as any)?.guestInvite?.findMany === "function"
        ? await (prisma as any).guestInvite
            .findMany({
              where: { matchId: id },
              select: { spotId: true, inviterId: true, guestUserId: true, name: true },
            })
            .catch(() => [])
        : [];

    const inviteBySpotId = new Map<string, { inviterId: string; guestUserId: string; name: string }>();
    for (const invite of guestInvites) {
      if (!invite?.spotId) continue;
      inviteBySpotId.set(invite.spotId, {
        inviterId: invite.inviterId,
        guestUserId: invite.guestUserId,
        name: invite.name,
      });
    }

    const organizerUser = match.organizer;
    const viewerId = await getSessionUserId().catch(() => null);
    let viewerIsAdmin = false;
    if (viewerId) {
      try {
        const viewer = await prisma.user.findUnique({ where: { id: viewerId }, select: { isAdmin: true, role: true } });
        viewerIsAdmin = !!viewer && (viewer.isAdmin || viewer.role === "SUPERADMIN");
      } catch {}
    }
    const paidSpots = spots.filter((s: any) => s.status === "PAID");
    const availableSpots = spots.filter((s: any) => s.status === "AVAILABLE");
    const paid = paidSpots.length;
    const available = availableSpots.length;
    const rawMinSpots = (match as any).minSpotsToConfirm;
    const minRequired = typeof rawMinSpots === "number" && rawMinSpots > 0 ? rawMinSpots : match.totalSpots;


    const players = paidSpots.map((s: any, idx: number) => {
      const profile = s.user?.profile ?? null;
      const inviteInfo = inviteBySpotId.get(s.id) ?? null;
      const userId = s.userId ?? s.user?.id ?? inviteInfo?.guestUserId ?? null;
      const profileName = typeof profile?.name === "string" ? profile.name.trim() : "";
      const hasProfile = Boolean(userId && profileName.length > 0);
      const inviteName = typeof inviteInfo?.name === "string" ? inviteInfo.name.trim() : "";
      const displayName = hasProfile ? profileName : inviteName || `Jugador ${idx + 1}`;
      const position = s.position ?? (hasProfile ? profile?.position ?? null : null);
      const user = hasProfile ? { id: userId as string, name: profileName, position: profile?.position ?? null } : null;
      const isGuest = inviteInfo ? true : hasProfile ? !(s.user?.email ?? null) : true;
      const invitedByUserId = inviteInfo?.inviterId ?? null;
      const invitedByViewer = invitedByUserId ? invitedByUserId === viewerId : false;
      return {
        spotId: s.id,
        user,
        userId: s.userId ?? null,
        displayName,
        position,
        team: s.team ?? null,
        status: s.status,
        isGuest,
        invitedByUserId,
        invitedByViewer,
      };
    });

    const viewer = viewerId
      ? {
          isOrganizer: viewerId === match.organizerId,
          isAdmin: viewerIsAdmin,
          hasJoined: paidSpots.some((s: any) => {
            if (s.userId === viewerId) return true;
            const invite = inviteBySpotId.get(s.id);
            return invite?.guestUserId === viewerId;
          }),
          canDelete: viewerId === match.organizerId || viewerIsAdmin,
        }
      : null;

    let friendRecord = null as {
      id: string;
      status: "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";
      requesterId: string;
      addresseeId: string;
    } | null;
    if (viewerId && viewerId !== match.organizerId) {
      friendRecord = await prisma.friend.findFirst({
        where: {
          OR: [
            { requesterId: viewerId, addresseeId: match.organizerId },
            { requesterId: match.organizerId, addresseeId: viewerId },
          ],
        },
        select: { id: true, status: true, requesterId: true, addresseeId: true },
      });
    }
    const organizerFriendship = resolveFriendship(viewerId, match.organizerId, friendRecord);

    let cover = match.coverImageUrl as string | null | undefined;
    if (!cover) {
      if (typeof match.lat === "number" && typeof match.lng === "number") {
        const sv = streetViewUrl(match.lat, match.lng);
        cover = sv || buildStaticMapUrl({ lat: match.lat, lng: match.lng, width: 800, height: 400, pixelRatio: 1 }) || null;
      }
    }

    const out = {
      id: match.id,
      title: match.title,
      comuna: match.comuna,
      startsAt: match.startsAt,
      durationMins: match.durationMins,
      pricePerSpot: match.pricePerSpot,
      totalSpots: match.totalSpots,
      minSpotsToConfirm: minRequired,
      level: match.level,
      venueName: match.venueName,
      venueAddress: match.venueAddress,
      lat: match.lat,
      lng: match.lng,
      coverImageUrl: cover ?? null,
      paid,
      available,
      isConfirmed: paid >= minRequired,
      organizer:
        organizerUser?.profile?.name && organizerUser.profile.name.trim().length > 0
          ? { id: match.organizerId, name: organizerUser.profile.name.trim() }
          : null,
      organizerFriendship,
      players,
      viewer,
    };

    return NextResponse.json(out, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    try {
      console.error("[API] GET /api/matches/[id] error", err);
    } catch {}
    return NextResponse.json({ error: err?.message ?? "error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: { id: string } } | { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const rawParams: any = (ctx as any)?.params ?? ctx;
    const resolved: any = typeof rawParams?.then === "function" ? await rawParams : rawParams;
    const id: string | undefined = resolved?.id ?? resolved?.params?.id;
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const match = await prisma.match.findUnique({ where: { id }, select: { organizerId: true } });
    if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });

    let isAdmin = false;
    if (userId !== match.organizerId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true, role: true } });
      isAdmin = !!user && (user.isAdmin || user.role === "SUPERADMIN");
      if (!isAdmin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    await prisma.$transaction([
      prisma.message.deleteMany({ where: { matchId: id } }),
      prisma.waitlistEntry.deleteMany({ where: { matchId: id } }),
      prisma.payment.deleteMany({ where: { matchId: id } }),
      prisma.organizerRating.deleteMany({ where: { matchId: id } }),
      prisma.playerRating.deleteMany({ where: { matchId: id } }),
      prisma.spot.deleteMany({ where: { matchId: id } }),
      prisma.match.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true, message: "Partido eliminado correctamente" });
  } catch (err: any) {
    if (err instanceof Response) return err;
    try {
      console.error("[API] DELETE /api/matches/[id] error", err);
    } catch {}
    return NextResponse.json({ error: err?.message ?? "Error al eliminar partido" }, { status: 500 });
  }
}
