import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  deleteMatchCascade,
  removeSpotFromMatch,
  rescheduleMatch,
  updateSpotAssignment,
} from "@/lib/admin/match-tools";

async function ensureAdmin() {
  const userId = await requireUserId();
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isAdmin: true },
  });

  if (!actor || (actor.role !== "SUPERADMIN" && !actor.isAdmin)) {
    return null;
  }
  return userId;
}

function serializeMatch(match: any) {
  return {
    id: match.id,
    title: match.title,
    comuna: match.comuna,
    startsAt: match.startsAt.toISOString(),
    durationMins: match.durationMins,
    pricePerSpot: match.pricePerSpot,
    status: match.status,
    totalSpots: match.totalSpots,
    minSpotsToConfirm: match.minSpotsToConfirm,
    venue: match.venue
      ? {
          id: match.venue.id,
          name: match.venue.name,
        }
      : null,
    organizer: match.organizer
      ? {
          id: match.organizer.id,
          email: match.organizer.email,
          name: match.organizer.profile?.name ?? null,
        }
      : null,
    spots: match.spots.map((spot: any) => ({
      id: spot.id,
      status: spot.status,
      team: spot.team,
      position: spot.position,
      userId: spot.userId,
      priceCLP: spot.priceCLP,
      createdAt: spot.createdAt.toISOString(),
      user: spot.user
        ? {
            id: spot.user.id,
            email: spot.user.email,
            name: spot.user.profile?.name ?? null,
            comuna: spot.user.profile?.comuna ?? null,
            position: spot.user.profile?.position ?? null,
          }
        : null,
      payment: spot.payment
        ? {
            id: spot.payment.id,
            status: spot.payment.status,
            provider: spot.payment.provider,
            amountCLP: spot.payment.amountCLP,
            createdAt: spot.payment.createdAt.toISOString(),
          }
        : null,
      guestInvite: spot.guestInvite
        ? {
            name: spot.guestInvite.name,
            email: spot.guestInvite.email,
            inviterId: spot.guestInvite.inviterId,
          }
        : null,
    })),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const authorized = await ensureAdmin();
    if (!authorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: {
        venue: { select: { id: true, name: true } },
        organizer: { select: { id: true, email: true, profile: { select: { name: true } } } },
        spots: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, email: true, profile: { select: { name: true, comuna: true, position: true } } } },
            payment: { select: { id: true, status: true, provider: true, amountCLP: true, createdAt: true } },
            guestInvite: { select: { name: true, email: true, inviterId: true } },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    return NextResponse.json(serializeMatch(match), { status: 200 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[admin/matches:get]", err);
    return NextResponse.json({ error: "No se pudo cargar el partido" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const authorized = await ensureAdmin();
    if (!authorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const matchId = params.id;
    if (!matchId) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const payload = await request.json().catch(() => ({}));

    const reschedule = payload?.reschedule as
      | { startsAt?: string | null; durationMins?: number | null }
      | undefined;
    const removeSpotIds = Array.isArray(payload?.removeSpotIds)
      ? (payload.removeSpotIds as string[]).filter((id) => typeof id === "string")
      : [];
    const updateSpots = Array.isArray(payload?.updateSpots)
      ? (payload.updateSpots as Array<{ spotId?: string; team?: string | null; position?: string | null; status?: string | null }>).
          filter((entry) => typeof entry?.spotId === "string")
      : [];

    if (!reschedule && removeSpotIds.length === 0 && updateSpots.length === 0) {
      return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
    }

    if (reschedule?.startsAt) {
      const startsAt = new Date(reschedule.startsAt);
      if (Number.isNaN(startsAt.getTime())) {
        return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
      }
      await rescheduleMatch(matchId, startsAt, reschedule?.durationMins ?? undefined);
    }

    for (const spotId of removeSpotIds) {
      await removeSpotFromMatch(spotId);
    }

    const allowedStatuses = new Set(["AVAILABLE", "PAID", "RESERVED", "CANCELED"]);
    const allowedPositions = new Set(["ARQUERO", "DEFENSA", "LATERAL", "VOLANTE", "DELANTERO", null]);

    for (const spot of updateSpots) {
      const updates: { team?: string | null; position?: any; status?: any } = {};
      if (Object.prototype.hasOwnProperty.call(spot, "team")) {
        updates.team = spot.team ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(spot, "position")) {
        const pos = spot.position ?? null;
        if (!allowedPositions.has(pos)) {
          return NextResponse.json({ error: "Posición inválida" }, { status: 400 });
        }
        updates.position = pos;
      }
      if (Object.prototype.hasOwnProperty.call(spot, "status")) {
        const status = (spot.status ?? "").toString().toUpperCase();
        if (!allowedStatuses.has(status)) {
          return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
        }
        updates.status = status;
      }

      await updateSpotAssignment(spot.spotId as string, updates);
    }

    const updated = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        venue: { select: { id: true, name: true } },
        organizer: { select: { id: true, email: true, profile: { select: { name: true } } } },
        spots: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, email: true, profile: { select: { name: true, comuna: true, position: true } } } },
            payment: { select: { id: true, status: true, provider: true, amountCLP: true, createdAt: true } },
            guestInvite: { select: { name: true, email: true, inviterId: true } },
          },
        },
      },
    });

    if (!updated) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    return NextResponse.json(serializeMatch(updated), { status: 200 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[admin/matches:patch]", err);
    return NextResponse.json({ error: "No se pudo actualizar el partido" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const authorized = await ensureAdmin();
    if (!authorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const matchId = params.id;
    if (!matchId) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const exists = await prisma.match.findUnique({ where: { id: matchId }, select: { id: true } });
    if (!exists) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
    }

    await deleteMatchCascade(matchId);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[admin/matches:delete]", err);
    return NextResponse.json({ error: "No se pudo eliminar el partido" }, { status: 500 });
  }
}

