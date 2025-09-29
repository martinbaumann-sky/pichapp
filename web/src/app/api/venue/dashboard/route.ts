import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

function toISO(value: Date): string {
  return value.toISOString();
}

export async function GET() {
  try {
    const userId = await requireUserId();

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || (user.role !== "VENUE_ADMIN" && user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const venue = await prisma.venue.findFirst({
      where: { ownerId: userId },
      include: { fields: { select: { id: true, name: true } } },
    });

    if (!venue) {
      return NextResponse.json({ error: "Aún no registras una cancha" }, { status: 404 });
    }

    const [matches, spots, payments] = await Promise.all([
      prisma.match.findMany({
        where: { organizerId: userId },
        orderBy: { startsAt: "desc" },
        take: 100,
        select: {
          id: true,
          title: true,
          status: true,
          startsAt: true,
          totalSpots: true,
          pricePerSpot: true,
          venueName: true,
          venueAddress: true,
          spots: { select: { status: true } },
        },
      }),
      prisma.spot.findMany({
        where: {
          match: { organizerId: userId },
          status: { not: "AVAILABLE" },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          status: true,
          team: true,
          position: true,
          createdAt: true,
          match: { select: { id: true, title: true, startsAt: true, venueName: true } },
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { name: true } },
            },
          },
        },
      }),
      prisma.payment.findMany({
        where: { match: { organizerId: userId } },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          amountCLP: true,
          status: true,
          provider: true,
          createdAt: true,
          match: { select: { id: true, title: true } },
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const now = new Date();
    const formattedMatches = matches.map((match) => {
      const paidSpots = match.spots.filter((s) => s.status === "PAID").length;
      const reservedSpots = match.spots.filter((s) => s.status === "RESERVED").length;
      return {
        id: match.id,
        title: match.title,
        status: match.status,
        startsAt: toISO(match.startsAt),
        totalSpots: match.totalSpots,
        pricePerSpot: match.pricePerSpot,
        venueName: match.venueName,
        venueAddress: match.venueAddress,
        paidSpots,
        reservedSpots,
      };
    });

    const formattedBookings = spots.map((spot) => {
      const playerName = spot.user?.profile?.name?.trim() || spot.user?.email || "Reserva";
      return {
        id: spot.id,
        status: spot.status,
        team: spot.team,
        position: spot.position,
        createdAt: toISO(spot.createdAt),
        matchId: spot.match.id,
        matchTitle: spot.match.title,
        matchStartsAt: toISO(spot.match.startsAt),
        matchVenueName: spot.match.venueName,
        playerId: spot.user?.id ?? null,
        playerName,
        playerEmail: spot.user?.email ?? null,
      };
    });

    const formattedPayments = payments.map((payment) => {
      const playerName = payment.user?.profile?.name?.trim() || payment.user?.email || "Jugador";
      return {
        id: payment.id,
        amountCLP: payment.amountCLP,
        status: payment.status,
        provider: payment.provider,
        createdAt: toISO(payment.createdAt),
        matchId: payment.match.id,
        matchTitle: payment.match.title,
        playerId: payment.user?.id ?? null,
        playerName,
        playerEmail: payment.user?.email ?? null,
      };
    });

    const approvedPayments = formattedPayments.filter((p) => p.status === "APPROVED");
    const totalRevenue = approvedPayments.reduce((sum, payment) => sum + payment.amountCLP, 0);

    const totalSpots = matches.reduce((sum, m) => sum + m.totalSpots, 0);
    const totalPaidSpots = matches.reduce(
      (sum, m) => sum + m.spots.filter((s) => s.status === "PAID").length,
      0,
    );
    const fillRate = totalSpots > 0 ? totalPaidSpots / totalSpots : 0;

    const upcomingMatch = formattedMatches
      .filter((m) => new Date(m.startsAt) > now)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0] ?? null;

    const response = {
      venue: {
        id: venue.id,
        name: venue.name,
        address: venue.address,
        comuna: venue.comuna,
        lat: venue.lat,
        lng: venue.lng,
        plan: venue.plan,
        verified: venue.verified,
        payoutEmail: venue.payoutEmail,
        fields: venue.fields,
      },
      matches: formattedMatches,
      bookings: formattedBookings,
      payments: formattedPayments,
      metrics: {
        totalRevenue,
        totalMatches: matches.length,
        totalPaidSpots,
        fillRate,
        upcomingMatch,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[venue/dashboard]", err);
    return NextResponse.json({ error: "No se pudo cargar el panel" }, { status: 500 });
  }
}
