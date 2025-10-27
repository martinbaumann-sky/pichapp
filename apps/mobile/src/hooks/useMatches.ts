import { useQuery } from '@tanstack/react-query';

import { listMatches } from '../api/matches';

export function useMatches(filters: { comuna?: string; level?: string }) {
  return useQuery({
    queryKey: ['matches', filters],
    queryFn: () => listMatches(filters),
    staleTime: 60 * 1000,
  });
}
