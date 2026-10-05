import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  activityApi,
  callingCardsApi,
  camosApi,
  dashboardApi,
  eventsApi,
  matchesApi,
  notificationsApi,
  objectivesApi,
  profileApi,
  syncApi,
  weaponsApi,
  type WeaponQuery,
} from '../api/endpoints';
import { withCache } from '../lib/cache';
import { qk } from '../lib/queryClient';
import type { NotificationCategory } from '../api/types';

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: withCache('dashboard', dashboardApi.get),
  });
}

// ── Profile ───────────────────────────────────────────────────────────────────
export function useProfile() {
  return useQuery({
    queryKey: qk.profile,
    queryFn: withCache('profile', profileApi.get),
  });
}

// ── Weapons ───────────────────────────────────────────────────────────────────
export function useWeapons(query: WeaponQuery) {
  return useQuery({
    queryKey: qk.weapons(query as Record<string, unknown>),
    queryFn: withCache(`weapons:${JSON.stringify(query)}`, () => weaponsApi.list(query)),
  });
}

export function useWeaponCategories() {
  return useQuery({
    queryKey: qk.weaponCategories,
    queryFn: withCache('weapons:categories', weaponsApi.categories),
  });
}

export function useWeapon(id: string) {
  return useQuery({
    queryKey: qk.weapon(id),
    queryFn: withCache(`weapon:${id}`, () => weaponsApi.detail(id)),
    enabled: !!id,
  });
}

export function useToggleFavourite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => weaponsApi.toggleFavourite(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weapons'] });
      qc.invalidateQueries({ queryKey: ['weapon'] });
    },
  });
}

// ── Camos ─────────────────────────────────────────────────────────────────────
export function useCamoOverview() {
  return useQuery({
    queryKey: qk.camoOverview,
    queryFn: withCache('camos:overview', camosApi.overview),
  });
}

export function useCamoSets() {
  return useQuery({
    queryKey: qk.camoSets,
    queryFn: withCache('camos:sets', camosApi.sets),
  });
}

export function useWeaponCamos(weaponId: string) {
  return useQuery({
    queryKey: qk.weaponCamos(weaponId),
    queryFn: withCache(`camos:weapon:${weaponId}`, () => camosApi.weaponCamos(weaponId)),
    enabled: !!weaponId,
  });
}

/**
 * Flattened camo challenges across every tracked weapon.
 * Used by the combined Challenges screen so a single query powers the list.
 */
export function useAllCamoChallenges() {
  return useQuery({
    queryKey: ['camos', 'all-challenges'] as const,
    queryFn: withCache('camos:all-challenges', async () => {
      const page = await weaponsApi.list({ pageSize: 60 });
      const weapons = page.items ?? [];
      const results = await Promise.all(
        weapons.map(async (w) => {
          try {
            const challenges = await camosApi.weaponCamos(w.id);
            return challenges.map((c) => ({ ...c, weaponName: w.name, weaponId: w.id }));
          } catch {
            return [];
          }
        }),
      );
      return results.flat();
    }),
  });
}

// ── Calling cards ─────────────────────────────────────────────────────────────
export function useCallingCards() {
  return useQuery({
    queryKey: qk.callingCards,
    queryFn: withCache('calling-cards', callingCardsApi.list),
  });
}

export function useCallingCard(id: string) {
  return useQuery({
    queryKey: ['calling-card', id],
    queryFn: withCache(`calling-card:${id}`, () => callingCardsApi.detail(id)),
    enabled: !!id,
  });
}

// ── Events ────────────────────────────────────────────────────────────────────
export function useEvents() {
  return useQuery({
    queryKey: qk.events,
    queryFn: withCache('events', eventsApi.list),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: withCache(`event:${id}`, () => eventsApi.detail(id)),
    enabled: !!id,
  });
}

// ── Matches ───────────────────────────────────────────────────────────────────
export function useMatches(page = 1) {
  return useQuery({
    queryKey: qk.matches(page),
    queryFn: withCache(`matches:${page}`, () => matchesApi.list(page)),
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ['match', id],
    queryFn: withCache(`match:${id}`, () => matchesApi.detail(id)),
    enabled: !!id,
  });
}

export function useMatchStats() {
  return useQuery({
    queryKey: qk.matchStats,
    queryFn: withCache('matches:stats', matchesApi.stats),
  });
}

// ── Activity ──────────────────────────────────────────────────────────────────
export function useActivity(page = 1) {
  return useQuery({
    queryKey: qk.activity(page),
    queryFn: withCache(`activity:${page}`, () => activityApi.list(page)),
  });
}

// ── Objectives ────────────────────────────────────────────────────────────────
export function useObjectives() {
  return useQuery({
    queryKey: qk.objectives,
    queryFn: withCache('objectives', objectivesApi.list),
  });
}

export function useOverlaps() {
  return useQuery({
    queryKey: qk.overlaps,
    queryFn: withCache('objectives:overlaps', objectivesApi.overlaps),
  });
}

// ── Sync ──────────────────────────────────────────────────────────────────────
export function useProviders() {
  return useQuery({
    queryKey: qk.providers,
    queryFn: withCache('sync:providers', syncApi.providers),
  });
}

export function useRunSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId?: string) => syncApi.run(accountId),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

// ── Notifications ─────────────────────────────────────────────────────────────
export function useNotificationPrefs() {
  return useQuery({
    queryKey: qk.notificationPrefs,
    queryFn: withCache('notifications:prefs', notificationsApi.preferences),
  });
}

export function useSetNotificationPref() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ category, enabled }: { category: NotificationCategory; enabled: boolean }) =>
      notificationsApi.setPreference(category, enabled),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notificationPrefs });
    },
  });
}
