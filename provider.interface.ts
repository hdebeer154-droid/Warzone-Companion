/**
 * GameDataProvider — the replaceable data-source abstraction.
 *
 * The rest of the application depends ONLY on this interface. Concrete providers
 * (mock, manual, OCR, Activision/community, future sources) are resolved through
 * the ProviderRegistry, so a provider can be added, swapped, or disabled without
 * touching the domain logic. The mobile client never talks to a provider directly.
 */

export interface ProviderRef {
  /** Our internal cod_account id. */
  accountId: string;
  /** Provider-specific identifier (e.g. Activision user id). */
  externalId?: string | null;
  platform?: string | null;
  platformUsername?: string | null;
  /** Opaque cursor for incremental sync. */
  cursor?: string | null;
}

export interface ProviderIdentity {
  externalId: string;
  username: string;
  platform?: string;
  platformAccountId?: string;
  avatarUrl?: string;
}

export interface ProviderProfile {
  level: number;
  prestige: number;
  xp: number;
  totalMatches: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
}

export interface ProviderWeaponStat {
  weaponSlug: string;
  weaponName: string;
  category?: string;
  level: number;
  xp: number;
  kills: number;
  headshots: number;
  matches: number;
}

export interface ProviderMatchWeaponStat {
  weaponSlug: string;
  kills: number;
  headshots: number;
  damage: number;
}

export interface ProviderMatch {
  externalMatchId: string;
  mode?: string;
  map?: string;
  playlist?: string;
  startedAt?: string;
  endedAt?: string;
  kills: number;
  deaths: number;
  assists: number;
  placement?: number;
  damage: number;
  xp: number;
  weapons?: ProviderMatchWeaponStat[];
  raw?: unknown;
}

export interface ProviderChallengeProgress {
  /** Stable key used to match a challenge in our DB (camo/calling-card/event). */
  kind: 'CAMO' | 'CALLING_CARD' | 'EVENT';
  /** e.g. weapon slug + camo name, or challenge name. */
  key: string;
  currentValue: number;
  targetValue?: number;
  completed?: boolean;
}

export interface ProviderProgression {
  level: number;
  prestige: number;
  xp: number;
  challenges: ProviderChallengeProgress[];
}

export interface GetMatchesOptions {
  since?: Date;
  cursor?: string | null;
  limit?: number;
}

export interface ProviderResult<T> {
  data: T;
  /** New cursor to persist for incremental sync. */
  cursor?: string | null;
  /** True when the provider served cached/stale data. */
  stale?: boolean;
  fetchedAt: Date;
}

export interface GameDataProvider {
  readonly key: string;
  readonly name: string;
  /** Whether the provider is currently usable (credentials, upstream health, etc.). */
  isAvailable(): Promise<boolean>;

  getIdentity(ref: ProviderRef): Promise<ProviderIdentity>;
  getProfile(ref: ProviderRef): Promise<ProviderResult<ProviderProfile>>;
  getMatches(ref: ProviderRef, opts?: GetMatchesOptions): Promise<ProviderResult<ProviderMatch[]>>;
  getMatchDetails(ref: ProviderRef, matchId: string): Promise<ProviderMatch>;
  getWeaponStats(ref: ProviderRef): Promise<ProviderResult<ProviderWeaponStat[]>>;
  getChallenges(ref: ProviderRef): Promise<ProviderResult<ProviderChallengeProgress[]>>;
  getProgression(ref: ProviderRef): Promise<ProviderResult<ProviderProgression>>;
}

export const GAME_DATA_PROVIDER = Symbol('GAME_DATA_PROVIDER');
