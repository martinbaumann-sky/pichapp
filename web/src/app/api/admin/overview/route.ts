import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VENUE_PLANS } from "@/lib/venuePlans";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function toISO(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function GET() {
  try {
    const userId = await requireUserId();

    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isAdmin: true },
    });

    if (!actor || (actor.role !== "SUPERADMIN" && !actor.isAdmin)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS);
    const activeWindow = new Date(now.getTime() - 10 * 60 * 1000);

    const [
      playerCount,
      organizerCount,
      suspendedCount,
      activePlayersCount,
      activeOrganizersCount,
      venueCount,
      verifiedVenueCount,
      upcomingMatchesCount,
      finishedMatches30dCount,
      paymentsTotals,
      payments30dTotals,
      pendingPaymentsTotals,
      users,
      venues,
      matchesActive,
      matchesFinished,
      matchesCanceled,
      paymentsRecent,
      subscriptionCounts,
      subscriptionsExpiring,
      adminUsers,
      recentSessions,
      activePlayersNowCount,
      activeSessionsNow,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "PLAYER" } }),
      prisma.user.count({ where: { role: "VENUE_ADMIN" } }),
      prisma.user.count({ where: { disabledAt: { not: null } } }),
      prisma.user.count({ where: { role: "PLAYER", sessions: { some: { createdAt: { gte: thirtyDaysAgo } } } } }),
      prisma.user.count({ where: { role: "VENUE_ADMIN", sessions: { some: { createdAt: { gte: thirtyDaysAgo } } } } }),
      prisma.venue.count(),
      prisma.venue.count({ where: { verified: true } }),
      prisma.match.count({
        where: {
          startsAt: { gte: now },
          status: { in: ["PUBLISHED", "CONFIRMED", "FULL"] },
        },
      }),
      prisma.match.count({
        where: { startsAt: { gte: thirtyDaysAgo }, status: "FINISHED" },
      }),
      prisma.payment.aggregate({
        where: { status: "APPROVED" },
        _sum: { amountCLP: true },
      }),
      prisma.payment.aggregate({
        where: { status: "APPROVED", createdAt: { gte: thirtyDaysAgo } },
        _sum: { amountCLP: true },
      }),
      prisma.payment.aggregate({
        where: { status: "PENDING" },
        _sum: { amountCLP: true },
      }),
      prisma.user.findMany({
        take: 80,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          disabledAt: true,
          isAdmin: true,
          profile: { select: { name: true, comuna: true, phone: true, rating: true } },
        },
      }),
      prisma.venue.findMany({
        take: 60,
        orderBy: { createdAt: "desc" },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              profile: { select: { name: true, phone: true } },
            },
          },
          subscriptions: {
            orderBy: { createdAt: "desc" },
            take: 4,
          },
        },
      }),
      prisma.match.findMany({
        where: { status: { in: ["PUBLISHED", "CONFIRMED", "FULL"] } },
        take: 50,
        orderBy: { startsAt: "asc" },
        include: {
          organizer: { select: { email: true, profile: { select: { name: true } } } },
          venue: { select: { name: true, comuna: true } },
          spots: { select: { status: true } },
        },
      }),
      prisma.match.findMany({
        where: { status: "FINISHED" },
        take: 40,
        orderBy: { startsAt: "desc" },
        include: {
          organizer: { select: { email: true, profile: { select: { name: true } } } },
          venue: { select: { name: true, comuna: true } },
          spots: { select: { status: true } },
        },
      }),
      prisma.match.findMany({
        where: { status: { in: ["CANCELED", "CANCELED_MINIMUM"] } },
        take: 40,
        orderBy: { startsAt: "desc" },
        include: {
          organizer: { select: { email: true, profile: { select: { name: true } } } },
          venue: { select: { name: true, comuna: true } },
          spots: { select: { status: true } },
        },
      }),
      prisma.payment.findMany({
        take: 60,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true, profile: { select: { name: true } } } },
          match: { select: { title: true, venueName: true } },
        },
      }),
      prisma.venueSubscription.groupBy({
        by: ["plan", "status"],
        _count: { _all: true },
      }),
      prisma.venueSubscription.findMany({
        where: { status: "ACTIVE", nextChargeAt: { not: null } },
        take: 30,
        orderBy: { nextChargeAt: "asc" },
        include: {
          venue: { select: { name: true, plan: true } },
        },
      }),
      prisma.user.findMany({
        where: { OR: [{ isAdmin: true }, { role: "SUPERADMIN" }] },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          profile: { select: { name: true } },
          sessions: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
      prisma.session.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: "desc" },
        take: 40,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { name: true, comuna: true } },
            },
          },
        },
      }),
      prisma.session.count({
        where: {
          createdAt: { gte: activeWindow },
          user: { role: "PLAYER" },
        },
      }),
      prisma.session.findMany({
        where: {
          createdAt: { gte: activeWindow },
          user: { role: "PLAYER" },
        },
        orderBy: { createdAt: "desc" },
        take: 40,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { name: true, comuna: true } },
            },
          },
        },
      }),
    ]);

    const userIds = users.map((u) => u.id);
    const venueIds = venues.map((v) => v.id);

    const [
      matchesOrganized,
      matchesPlayed,
      paymentsByUser,
      sessionsLatest,
      venueMatchStats,
      venuePaymentStats,
      paymentsApproved30dByVenue,
    ] = await Promise.all([
      prisma.match.groupBy({
        by: ["organizerId"],
        where: { organizerId: { in: userIds } },
        _count: { _all: true },
      }),
      prisma.spot.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, status: "PAID" },
        _count: { _all: true },
      }),
      prisma.payment.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _sum: { amountCLP: true },
        _count: { _all: true },
      }),
      prisma.session.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _max: { createdAt: true },
      }),
      prisma.match.findMany({
        where: { venueId: { in: venueIds } },
        select: { id: true, venueId: true, status: true, startsAt: true },
      }),
      prisma.payment.findMany({
        where: { match: { venueId: { in: venueIds } } },
        select: {
          amountCLP: true,
          status: true,
          match: { select: { venueId: true } },
        },
      }),
      prisma.payment.findMany({
        where: {
          status: "APPROVED",
          createdAt: { gte: thirtyDaysAgo },
          match: { venueId: { in: venueIds } },
        },
        select: {
          amountCLP: true,
          match: { select: { venueId: true } },
        },
      }),
    ]);

    const organizedMap = new Map<string, number>();
    matchesOrganized.forEach((item) => organizedMap.set(item.organizerId, item._count._all));

    const playedMap = new Map<string, number>();
    matchesPlayed.forEach((item) => playedMap.set(item.userId, item._count._all));

    const paymentsMap = new Map<string, { total: number; count: number }>();
    paymentsByUser.forEach((item) => {
      paymentsMap.set(item.userId, {
        total: item._sum.amountCLP ?? 0,
        count: item._count._all,
      });
    });

    const lastLoginMap = new Map<string, Date | null>();
    sessionsLatest.forEach((item) => {
      lastLoginMap.set(item.userId, item._max.createdAt ?? null);
    });

    const usersPayload = users.map((userItem) => {
      const organized = organizedMap.get(userItem.id) ?? 0;
      const played = playedMap.get(userItem.id) ?? 0;
      const paymentsInfo = paymentsMap.get(userItem.id) ?? { total: 0, count: 0 };
      const lastLogin = lastLoginMap.get(userItem.id) ?? null;
      return {
        id: userItem.id,
        email: userItem.email,
        role: userItem.role,
        createdAt: userItem.createdAt.toISOString(),
        disabledAt: toISO(userItem.disabledAt),
        isAdmin: userItem.isAdmin,
        profile: {
          name: userItem.profile?.name ?? null,
          comuna: userItem.profile?.comuna ?? null,
          phone: userItem.profile?.phone ?? null,
          rating: userItem.profile?.rating ?? null,
        },
        matchesOrganized: organized,
        matchesPlayed: played,
        paymentsTotal: paymentsInfo.total,
        paymentsCount: paymentsInfo.count,
        lastLoginAt: toISO(lastLogin),
      };
    });

    const venueMatchMap = new Map<string, { active: number; upcoming: number }>();
    venueMatchStats.forEach((match) => {
      if (!match.venueId) return;
      const current = venueMatchMap.get(match.venueId) ?? { active: 0, upcoming: 0 };
      const isActive = ["PUBLISHED", "CONFIRMED", "FULL"].includes(match.status);
      if (isActive) {
        current.active += 1;
        if (match.startsAt > now) current.upcoming += 1;
      }
      venueMatchMap.set(match.venueId, current);
    });

    const venueRevenueMap = new Map<
      string,
      { approved: number; pending: number; approved30d: number }
    >();
    venuePaymentStats.forEach((payment) => {
      const venueId = payment.match?.venueId;
      if (!venueId) return;
      const current = venueRevenueMap.get(venueId) ?? { approved: 0, pending: 0, approved30d: 0 };
      if (payment.status === "APPROVED") {
        current.approved += payment.amountCLP;
      }
      if (payment.status === "PENDING") {
        current.pending += payment.amountCLP;
      }
      venueRevenueMap.set(venueId, current);
    });

    paymentsApproved30dByVenue.forEach((payment) => {
      const venueId = payment.match?.venueId;
      if (!venueId) return;
      const current = venueRevenueMap.get(venueId) ?? { approved: 0, pending: 0, approved30d: 0 };
      current.approved30d += payment.amountCLP;
      venueRevenueMap.set(venueId, current);
    });

    const venuesPayload = venues.map((venue) => {
      const ownerName = venue.owner?.profile?.name ?? null;
      const ownerEmail = venue.owner?.email ?? null;
      const stats = venueRevenueMap.get(venue.id) ?? {
        approved: 0,
        pending: 0,
        approved30d: 0,
      };
      const matchStats = venueMatchMap.get(venue.id) ?? { active: 0, upcoming: 0 };
      return {
        id: venue.id,
        name: venue.name,
        comuna: venue.comuna,
        plan: venue.plan,
        verified: venue.verified,
        createdAt: venue.createdAt.toISOString(),
        owner: {
          id: venue.owner?.id ?? null,
          name: ownerName,
          email: ownerEmail,
        },
        revenueApproved: stats.approved,
        revenueApproved30d: stats.approved30d,
        pendingPayments: stats.pending,
        matchStats,
        subscriptions: venue.subscriptions.map((subscription) => ({
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          createdAt: subscription.createdAt.toISOString(),
          activatedAt: toISO(subscription.activatedAt),
          canceledAt: toISO(subscription.canceledAt),
          nextChargeAt: toISO(subscription.nextChargeAt),
          lastChargeAt: toISO(subscription.lastChargeAt),
        })),
      };
    });

    const matchesPayload = (matchList: typeof matchesActive) =>
      matchList.map((match) => {
        const paidSpots = match.spots.filter((spot) => spot.status === "PAID").length;
        const reservedSpots = match.spots.filter((spot) => spot.status === "RESERVED").length;
        return {
          id: match.id,
          title: match.title,
          status: match.status,
          startsAt: match.startsAt.toISOString(),
          comuna: match.comuna,
          venueName: match.venue?.name ?? match.venueName ?? null,
          organizerName: match.organizer.profile?.name ?? match.organizer.email,
          pricePerSpot: match.pricePerSpot,
          totalSpots: match.totalSpots,
          paidSpots,
          reservedSpots,
        };
      });

    const paymentsPayload = paymentsRecent.map((payment) => ({
      id: payment.id,
      amountCLP: payment.amountCLP,
      status: payment.status,
      provider: payment.provider,
      createdAt: payment.createdAt.toISOString(),
      user: {
        email: payment.user?.email ?? null,
        name: payment.user?.profile?.name ?? null,
      },
      match: {
        title: payment.match?.title ?? null,
        venueName: payment.match?.venueName ?? null,
      },
    }));

    const countsByPlan = subscriptionCounts.reduce<Record<string, Record<string, number>>>(
      (acc, item) => {
        const planKey = item.plan ?? "desconocido";
        const statusKey = item.status ?? "DESCONOCIDO";
        if (!acc[planKey]) acc[planKey] = {};
        acc[planKey][statusKey] = item._count._all;
        return acc;
      },
      {},
    );

    const adminsPayload = adminUsers.map((admin) => ({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.profile?.name ?? null,
      createdAt: admin.createdAt.toISOString(),
      lastLoginAt: toISO(admin.sessions[0]?.createdAt ?? null),
    }));

    const sessionsPayload = recentSessions
      .filter((session) => session.user)
      .map((session) => ({
        userId: session.user.id,
        email: session.user.email ?? null,
        name: session.user.profile?.name ?? null,
        comuna: session.user.profile?.comuna ?? null,
        createdAt: session.createdAt.toISOString(),
      }));

    const activeNowPayload = activeSessionsNow
      .filter((session) => session.user)
      .map((session) => ({
        userId: session.user.id,
        email: session.user.email ?? null,
        name: session.user.profile?.name ?? null,
        comuna: session.user.profile?.comuna ?? null,
        lastSeenAt: session.createdAt.toISOString(),
      }));

    const totalApproved = paymentsTotals._sum.amountCLP ?? 0;
    const totalApproved30d = payments30dTotals._sum.amountCLP ?? 0;
    const totalPending = pendingPaymentsTotals._sum.amountCLP ?? 0;

    const commissionRetained30d = paymentsApproved30dByVenue.reduce((sum, payment) => {
      const venueId = payment.match?.venueId;
      if (!venueId) return sum;
      const venue = venues.find((item) => item.id === venueId);
      if (!venue) return sum;
      const plan = VENUE_PLANS[(venue.plan?.toLowerCase?.() as keyof typeof VENUE_PLANS) ?? "gratis"];
      const rate = plan?.commissionRate ?? 0.14;
      return sum + Math.round(payment.amountCLP * rate);
    }, 0);

    return NextResponse.json(
      {
        generatedAt: now.toISOString(),
        summary: {
          totals: {
            players: playerCount,
            activePlayers30d: activePlayersCount,
            activePlayersNow: activePlayersNowCount,
            organizers: organizerCount,
            activeOrganizers30d: activeOrganizersCount,
            venues: venueCount,
            verifiedVenues: verifiedVenueCount,
            upcomingMatches: upcomingMatchesCount,
            finishedMatches30d: finishedMatches30dCount,
          },
          revenue: {
            totalApproved,
            approved30d: totalApproved30d,
            pending: totalPending,
            retainedCommission30d: commissionRetained30d,
          },
        },
        users: {
          totals: {
            players: playerCount,
            organizers: organizerCount,
            suspended: suspendedCount,
            activeNow: activePlayersNowCount,
          },
          list: usersPayload,
          recentLogins: sessionsPayload,
          activeNow: activeNowPayload,
        },
        venues: {
          totals: {
            active: verifiedVenueCount,
            inactive: venueCount - verifiedVenueCount,
          },
          list: venuesPayload,
        },
        matches: {
          active: matchesPayload(matchesActive),
          finished: matchesPayload(matchesFinished),
          canceled: matchesPayload(matchesCanceled),
        },
        payments: {
          recent: paymentsPayload,
        },
        subscriptions: {
          countsByPlan,
          expiringSoon: subscriptionsExpiring.map((subscription) => ({
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            nextChargeAt: toISO(subscription.nextChargeAt),
            venueName: subscription.venue?.name ?? null,
            venuePlan: subscription.venue?.plan ?? null,
          })),
        },
        admins: {
          list: adminsPayload,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[admin/overview]", err);
    return NextResponse.json({ error: "No se pudo cargar el panel" }, { status: 500 });
  }
}

