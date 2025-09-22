import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streetViewUrl } from "@/lib/places";
import { buildStaticMapUrl } from "@/lib/maps";
import { getSessionUserId } from "@/lib/auth-core";
import { requireUserId } from "@/lib/auth";
import { resolveFriendship } from "@/lib/friendship";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    let m = null as any;
    try {
      m = await prisma.match.findUnique({
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
          spots: { select: { id: true, status: true, userId: true, position: true, team: true } },
        },
      });
    } catch {
      // Fallback para clientes sin regenerar: reintentar sin el campo
      m = await prisma.match.findUnique({
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
          level: true,
          venueName: true,
          venueAddress: true,
          lat: true,
          lng: true,
          coverImageUrl: true,
          spots: { select: { id: true, status: true, userId: true, position: true, team: true } },
        },
      });
    }
    if (!m) return NextResponse.json({ error: "not found" }, { status: 404 });

    // counts
    const paid = m.spots.filter((s: any) => s.status === "PAID").length;
    const available = m.spots.filter((s: any) => s.status === "AVAILABLE").length;
    const minRequired = typeof (m as any).minSpotsToConfirm === 'number' && (m as any).minSpotsToConfirm > 0 ? (m as any).minSpotsToConfirm : m.totalSpots;

    // organizer name
    const profile = await prisma.profile.findUnique({ where: { userId: m.organizerId } }).catch(() => null);

    // Build confirmed players list (spots PAID): name + position
    const paidSpots = m.spots.filter((s: any) => s.status === "PAID");
    const userIds = Array.from(new Set(paidSpots.map((s: any) => s.userId).filter(Boolean)));
    let profiles: any[] = [];
    if (userIds.length > 0) {
      profiles = await prisma.profile.findMany({ where: { userId: { in: userIds as any } } }).catch(() => []);
    }
    const profById: Record<string, any> = {};
    for (const p of profiles) profById[p.userId] = p;
    const players = paidSpots.map((s: any, idx: number) => {
      const prof = s.userId ? profById[s.userId] : null;
      const user = prof ? { id: s.userId, name: prof.name, position: prof.position ?? null } : null;
      const position = s.position ?? (user ? user.position : null);
      const displayName = user?.name ?? `Jugador ${idx + 1}`;
      return {`n        spotId: s.id,`n        user,`n        userId: s.userId ?? null,`n        displayName,`n        position,`n        team: s.team ?? null,`n        status: s.status,`n      };
    });

    const viewerId = await getSessionUserId();
    let viewerIsAdmin = false;
    if (viewerId) {
      try {
        const viewer = await prisma.user.findUnique({ where: { id: viewerId }, select: { isAdmin: true } });
        viewerIsAdmin = !!viewer?.isAdmin;
      } catch {}
    }

    const viewer = viewerId
      ? {
          isOrganizer: viewerId === m.organizerId,
          isAdmin: viewerIsAdmin,
          hasJoined: paidSpots.some((s: any) => s.userId === viewerId),
          canDelete: viewerId === m.organizerId || viewerIsAdmin,
        }
      : null;

    let friendRecord = null as { id: string; status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED'; requesterId: string; addresseeId: string } | null;
    if (viewerId && viewerId !== m.organizerId) {
      friendRecord = await prisma.friend.findFirst({
        where: {
          OR: [
            { requesterId: viewerId, addresseeId: m.organizerId },
            { requesterId: m.organizerId, addresseeId: viewerId },
          ],
        },
        select: { id: true, status: true, requesterId: true, addresseeId: true },
      });
    }
    const organizerFriendship = resolveFriendship(viewerId, m.organizerId, friendRecord);

    // cover image fallback
    let cover = m.coverImageUrl as string | null | undefined;
    if (!cover) {
      if (typeof m.lat === "number" && typeof m.lng === "number") {
        const sv = streetViewUrl(m.lat, m.lng);
        cover = sv || buildStaticMapUrl({ lat: m.lat, lng: m.lng, width: 800, height: 400, pixelRatio: 1 }) || null;
      }
    }

    const out = {
      id: m.id,
      title: m.title,
      comuna: m.comuna,
      startsAt: m.startsAt,
      durationMins: m.durationMins,
      pricePerSpot: m.pricePerSpot,
      totalSpots: m.totalSpots,
      minSpotsToConfirm: minRequired,
      level: m.level,
      venueName: m.venueName,
      venueAddress: m.venueAddress,
      lat: m.lat,
      lng: m.lng,
      coverImageUrl: cover ?? null,
      paid,
      available,
      isConfirmed: paid >= minRequired,
      organizer: profile ? { id: m.organizerId, name: profile.name } : null,
      organizerFriendship,
      players,
      viewer,
    };

    return NextResponse.json(out);
  } catch (err) {
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const id = params.id;
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const match = await prisma.match.findUnique({ where: { id }, select: { organizerId: true } });
    if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });

    let isAdmin = false;
    if (userId !== match.organizerId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
      isAdmin = !!user?.isAdmin;
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

