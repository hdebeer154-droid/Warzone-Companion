import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/client';

/**
 * Shared React Query client.
 *
 * - Caches aggressively so navigation is instant and offline-friendly.
 * - Does not retry auth/validation errors (4xx) — only transient failures.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if (error.status >= 400 && error.status < 500) return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Query keys — centralised to avoid typos and enable targeted invalidation. */
export const qk = {
  dashboard: ['dashboard'] as const,
  profile: ['profile'] as const,
  accounts: ['accounts'] as const,
  weapons: (query: Record<string, unknown>) => ['weapons', query] as const,
  weaponCategories: ['weapons', 'categories'] as const,
  weapon: (id: string) => ['weapon', id] as const,
  camoOverview: ['camos', 'overview'] as const,
  camoSets: ['camos', 'sets'] as const,
  weaponCamos: (id: string) => ['camos', 'weapon', id] as const,
  callingCards: ['calling-cards'] as const,
  events: ['events'] as const,
  matches: (page: number) => ['matches', page] as const,
  matchStats: ['matches', 'stats'] as const,
  activity: (page: number) => ['activity', page] as const,
  objectives: ['objectives'] as const,
  overlaps: ['objectives', 'overlaps'] as const,
  providers: ['sync', 'providers'] as const,
  notificationPrefs: ['notifications', 'preferences'] as const,
};
