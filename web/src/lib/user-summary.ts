import { prisma } from "@/lib/db";
import { resolveFriendship, FriendshipSnapshot } from "@/lib/friendship";

type MatchSummary = {
  id: string;
  title: string;
  startsAt: string;
  status: string;
  comuna: string | null;
  venueName: string | null;
};

type PublicStats = {
  matchesOrganized: number;
  matchesUpcoming: number;
  matchesPlayed: number;
  friendsCount: number;
};

export type PublicUserSummary = {
  user: { id: string; name: string };
  stats: PublicStats;
  recentOrganized: MatchSummary[];
  recentPlayed: MatchSummary[];
  friendship: FriendshipSnapshot;
};

export async function getPublicUserSummary(userId: string, viewerId: string | null): Promise<PublicUserSummary | null> {
  if (!userId) return null;

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { name: true },
  });

  if (!profile) return null;

  const now = new Date();

  const [organizedCount, upcomingCount, playedCount, friendsCount, recentOrganizedMatches, recentPlayedSpots] = await Promise.all([
    prisma.match.count({ where: { organizerId: userId } }),
    prisma.match.count({ where: { organizerId: userId, startsAt: { gte: now }, status: { in: ["PUBLISHED", "FULL"] } } }),
    prisma.spot.count({ where: { userId, status: "PAID" } }),
    prisma.friend.count({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
    }),
    prisma.match.findMany({
      where: { organizerId: userId },
      orderBy: { startsAt: "desc" },
      take: 5,
      select: { id: true, title: true, startsAt: true, status: true, comuna: true, venueName: true },
    }),
    prisma.spot.findMany({
      where: { userId, status: "PAID" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        match: { select: { id: true, title: true, startsAt: true, status: true, comuna: true, venueName: true } },
      },
    }),
  ]);

  const recentOrganized: MatchSummary[] = recentOrganizedMatches.map((m) => ({
    id: m.id,
    title: m.title,
    startsAt: m.startsAt.toISOString(),
    status: m.status,
    comuna: m.comuna,
    venueName: m.venueName,
  }));

  const recentPlayed: MatchSummary[] = recentPlayedSpots
    .map((spot) => spot.match)
    .filter((match): match is NonNullable<typeof match> => !!match)
    .map((m) => ({
      id: m.id,
      title: m.title,
      startsAt: m.startsAt.toISOString(),
      status: m.status,
      comuna: m.comuna,
      venueName: m.venueName,
    }));

  const friendRecord = viewerId && viewerId !== userId
    ? await prisma.friend.findFirst({
        where: {
          OR: [
            { requesterId: viewerId, addresseeId: userId },
            { requesterId: userId, addresseeId: viewerId },
          ],
        },
        select: { id: true, status: true, requesterId: true, addresseeId: true },
      })
    : null;

  const friendship = resolveFriendship(viewerId, userId, friendRecord);

  return {
    user: { id: userId, name: profile.name },
    stats: {
      matchesOrganized: organizedCount,
      matchesUpcoming: upcomingCount,
      matchesPlayed: playedCount,
      friendsCount,
    },
    recentOrganized,
    recentPlayed,
    friendship,
  };
}
