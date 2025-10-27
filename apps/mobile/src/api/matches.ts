import { mutate, request } from './client';

export type MatchSummary = {
  id: string;
  title: string;
  comuna: string;
  startsAt: string;
  level: string;
  pricePerSpot: number;
  totalSpots: number;
  minSpotsToConfirm: number;
  confirmed: boolean;
  paid: number;
  available: number;
  friendCount: number;
  friendNames: string[];
  coverImageUrl: string | null;
  lat: number | null;
  lng: number | null;
  venueName: string | null;
  venueAddress: string | null;
};

export type MatchDetail = MatchSummary & {
  status: string;
  durationMins: number | null;
  organizer: {
    id: string;
    name: string | null;
  } | null;
  players: {
    spotId: string;
    displayName: string;
    team: string | null;
    position: string | null;
    isFriend: boolean;
    invitedByViewer: boolean;
  }[];
  viewer: {
    isOrganizer: boolean;
    isAdmin: boolean;
    hasJoined: boolean;
    canDelete: boolean;
  } | null;
};

export async function listMatches(params: { comuna?: string; level?: string } = {}): Promise<MatchSummary[]> {
  const query = new URLSearchParams();
  if (params.comuna) query.set('comuna', params.comuna);
  if (params.level) query.set('level', params.level);
  query.set('pageSize', '24');
  const data = await request<{ items: MatchSummary[] }>(`/api/matches?${query.toString()}`);
  return data.items;
}

export async function getMatch(id: string): Promise<MatchDetail> {
  return request<MatchDetail>(`/api/matches/${id}`);
}

export async function createMatch(payload: Record<string, unknown>) {
  return mutate(`/api/matches`, 'POST', payload);
}

export async function joinMatch(matchId: string) {
  return mutate(`/api/matches/${matchId}/join`, 'POST', {});
}
