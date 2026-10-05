import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  GameDataProvider,
  GetMatchesOptions,
  ProviderChallengeProgress,
  ProviderIdentity,
  ProviderMatch,
  ProviderProfile,
  ProviderProgression,
  ProviderRef,
  ProviderResult,
  ProviderWeaponStat,
} from '../provider.interface';

/**
 * Deterministic mock provider.
 *
 * This is NOT presented as an Activision integration. It implements the exact
 * same GameDataProvider contract a real provider would, so it can be swapped
 * out later. It reads the weapon catalogue from the database and produces
 * realistic, reproducible progression. Each sync advances a per-account tick so
 * incremental synchronisation and the activity feed can be demonstrated.
 */
@Injectable()
export class MockProvider implements GameDataProvider {
  readonly key = 'mock';
  readonly name = 'Mock Provider (deterministic, replaceable)';
  private readonly logger = new Logger(MockProvider.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async isAvailable(): Promise<boolean> {
    return true;
  }

  /** Simple deterministic hash -> [0,1). */
  private rand(seed: string): number {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 100000) / 100000;
  }

  private async tick(accountId: string): Promise<number> {
    const key = `mock:tick:${accountId}`;
    const n = await this.redis.client.incr(key);
    return n;
  }

  private async weapons() {
    return this.prisma.weapon.findMany({
      where: { active: true },
      orderBy: { orderIndex: 'asc' },
      select: { id: true, slug: true, name: true, category: true, maxLevel: true },
    });
  }

  private async userIdFor(ref: ProviderRef): Promise<string | null> {
    const account = await this.prisma.codAccount.findUnique({
      where: { id: ref.accountId },
      select: { userId: true },
    });
    return account?.userId ?? null;
  }

  async getIdentity(ref: ProviderRef): Promise<ProviderIdentity> {
    const account = await this.prisma.codAccount.findUnique({ where: { id: ref.accountId } });
    const username = account?.activisionUsername ?? account?.platformUsername ?? `Operator-${ref.accountId.slice(0, 6)}`;
    return {
      externalId: account?.activisionUserId ?? `mock-${ref.accountId}`,
      username,
      platform: account?.platform ?? 'UNKNOWN',
      platformAccountId: account?.platformAccountId ?? undefined,
    };
  }

  async getProfile(ref: ProviderRef): Promise<ProviderResult<ProviderProfile>> {
    const userId = await this.userIdFor(ref);
    const existing = userId
      ? await this.prisma.playerProfile.findUnique({ where: { userId } })
      : null;
    if (existing) {
      // Anchor to last-known profile and advance slowly (occasional level-up).
      const tick = await this.tick(ref.accountId + ':profile');
      const levelUp = tick % 7 === 0;
      return {
        data: {
          level: existing.level + (levelUp ? 1 : 0),
          prestige: existing.prestige,
          xp: existing.xp + 250,
          totalMatches: existing.totalMatches + 1,
          wins: existing.wins + (tick % 5 === 0 ? 1 : 0),
          kills: existing.kills + 6,
          deaths: existing.deaths + 3,
          assists: existing.assists + 3,
          damage: Number(existing.damage) + 2400,
        },
        fetchedAt: new Date(),
      };
    }
    const seed = ref.accountId;
    const base = 40 + Math.floor(this.rand(seed + 'lvl') * 30); // 40..69
    const prestige = Math.floor(this.rand(seed + 'pre') * 5);
    const matches = 900 + Math.floor(this.rand(seed + 'm') * 600);
    const wins = Math.floor(matches * (0.08 + this.rand(seed + 'w') * 0.12));
    const kills = matches * (4 + Math.floor(this.rand(seed + 'k') * 6));
    const deaths = Math.floor(kills / (1.0 + this.rand(seed + 'kd') * 1.2));
    return {
      data: {
        level: base,
        prestige,
        xp: 120000 + Math.floor(this.rand(seed + 'xp') * 400000),
        totalMatches: matches,
        wins,
        kills,
        deaths,
        assists: Math.floor(kills * 0.4),
        damage: kills * 320,
      },
      fetchedAt: new Date(),
    };
  }

  async getWeaponStats(ref: ProviderRef): Promise<ProviderResult<ProviderWeaponStat[]>> {
    const weapons = await this.weapons();
    const tick = await this.tick(ref.accountId);
    const userId = await this.userIdFor(ref);
    // Anchor to the last-known state we stored, then advance slightly. A real
    // provider reports the *current* account state, which is naturally a little
    // ahead of what we last synchronised — this reproduces that behaviour and
    // keeps the demo data stable across syncs.
    const existing = userId
      ? await this.prisma.weaponProgress.findMany({ where: { userId } })
      : [];
    const byWeaponId = new Map(existing.map((e) => [e.weaponId, e]));

    const data: ProviderWeaponStat[] = weapons.map((w, i) => {
      const prev = byWeaponId.get(w.id);
      if (prev) {
        const levelUp = (tick + i) % 5 === 0 && prev.level < w.maxLevel;
        const level = levelUp ? prev.level + 1 : prev.level;
        const killBump = (tick + i) % 2 === 0 ? 1 + ((tick + i) % 3) : 0;
        const kills = prev.kills + killBump;
        const hsBump = (tick + i) % 3 === 0 ? 1 : 0;
        const headshots = Math.min(kills, prev.headshots + hsBump);
        return {
          weaponSlug: w.slug,
          weaponName: w.name,
          category: w.category,
          level,
          xp: prev.xp + killBump * 120,
          kills,
          headshots,
          matches: prev.matches + (killBump > 0 ? 1 : 0),
        };
      }
      const r = this.rand(ref.accountId + w.slug);
      const level = Math.max(1, Math.min(w.maxLevel, Math.floor(r * w.maxLevel)));
      const kills = 40 + Math.floor(r * 900);
      return {
        weaponSlug: w.slug,
        weaponName: w.name,
        category: w.category,
        level,
        xp: Math.floor(r * 50000),
        kills,
        headshots: Math.floor(kills * (0.15 + this.rand(w.slug + 'hs') * 0.25)),
        matches: 10 + Math.floor(r * 120),
      };
    });
    return { data, fetchedAt: new Date() };
  }

  async getMatches(ref: ProviderRef, opts?: GetMatchesOptions): Promise<ProviderResult<ProviderMatch[]>> {
    const weapons = await this.weapons();
    const limit = opts?.limit ?? 20;
    const tick = await this.tick(ref.accountId + ':matches');
    const maps = ['Verdansk', 'Rebirth Island', 'Urzikstan', 'Ashika Island', 'Fortunes Keep'];
    const modes = ['Battle Royale', 'Resurgence', 'Plunder', 'Lockdown'];
    const playlists = ['BR Quads', 'Resurgence Trios', 'BR Solos', 'Plunder Quads'];
    const now = Date.now();
    // Advance the newest match index slowly (≈2 new matches per sync) so the
    // history grows realistically instead of duplicating the whole window.
    const perSync = 2;
    const newest = tick * perSync;
    const matches: ProviderMatch[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = newest - i;
      if (idx < 0) break;
      const r = this.rand(ref.accountId + 'match' + idx);
      const kills = Math.floor(r * 18);
      const deaths = 1 + Math.floor(this.rand(ref.accountId + 'md' + idx) * 5);
      const placement = 1 + Math.floor(this.rand(ref.accountId + 'mp' + idx) * 30);
      const startedAt = new Date(now - (i + 1) * (45 * 60 * 1000) - Math.floor(r * 600000));
      const w1 = weapons[Math.floor(this.rand(ref.accountId + 'mw' + idx) * weapons.length)];
      const w2 = weapons[Math.floor(this.rand(ref.accountId + 'mw2' + idx) * weapons.length)];
      matches.push({
        externalMatchId: `mock-${ref.accountId}-${idx}`,
        mode: modes[Math.floor(r * modes.length)],
        map: maps[Math.floor(this.rand(ref.accountId + 'mm' + idx) * maps.length)],
        playlist: playlists[Math.floor(this.rand(ref.accountId + 'pl' + idx) * playlists.length)],
        startedAt: startedAt.toISOString(),
        endedAt: new Date(startedAt.getTime() + 20 * 60 * 1000).toISOString(),
        kills,
        deaths,
        assists: Math.floor(kills * 0.5),
        placement,
        damage: kills * (250 + Math.floor(r * 400)),
        xp: 1500 + Math.floor(r * 9000),
        weapons: [
          { weaponSlug: w1.slug, kills: Math.ceil(kills * 0.6), headshots: Math.floor(kills * 0.15), damage: kills * 180 },
          { weaponSlug: w2.slug, kills: Math.floor(kills * 0.4), headshots: Math.floor(kills * 0.08), damage: kills * 120 },
        ],
        raw: { source: 'mock', idx },
      });
    }
    return { data: matches, cursor: String(tick), fetchedAt: new Date() };
  }

  async getMatchDetails(ref: ProviderRef, matchId: string): Promise<ProviderMatch> {
    const res = await this.getMatches(ref, { limit: 50 });
    const found = res.data.find((m) => m.externalMatchId === matchId);
    if (!found) throw new Error(`Match ${matchId} not found at provider`);
    return found;
  }

  async getChallenges(ref: ProviderRef): Promise<ProviderResult<ProviderChallengeProgress[]>> {
    const weapons = await this.weapons();
    const tick = await this.tick(ref.accountId + ':chal');
    const userId = await this.userIdFor(ref);
    const challenges: ProviderChallengeProgress[] = [];
    for (const w of weapons) {
      const targets = [
        { key: `${w.slug}:headshots`, req: 'HEADSHOTS', target: 100 },
        { key: `${w.slug}:longshots`, req: 'LONGSHOTS', target: 50 },
        { key: `${w.slug}:kills`, req: 'KILLS', target: 250 },
      ];
      for (const t of targets) {
        let base: number;
        if (userId) {
          const ch = await this.prisma.camoChallenge.findFirst({
            where: { weaponId: w.id, requirementType: t.req },
          });
          const prog = ch
            ? await this.prisma.camoProgress.findUnique({
                where: { userId_camoChallengeId: { userId, camoChallengeId: ch.id } },
              })
            : null;
          base = prog ? prog.currentValue : Math.floor(this.rand(ref.accountId + w.slug + t.req) * t.target);
        } else {
          base = Math.floor(this.rand(ref.accountId + w.slug + t.req) * t.target);
        }
        const bump = (tick + w.slug.length) % 3 === 0 ? Math.min(t.target, base + 2) : base;
        challenges.push({
          kind: 'CAMO',
          key: t.key,
          currentValue: bump,
          targetValue: t.target,
          completed: bump >= t.target,
        });
      }
    }
    return { data: challenges, fetchedAt: new Date() };
  }

  async getProgression(ref: ProviderRef): Promise<ProviderResult<ProviderProgression>> {
    const [profile, challenges] = await Promise.all([this.getProfile(ref), this.getChallenges(ref)]);
    return {
      data: {
        level: profile.data.level,
        prestige: profile.data.prestige,
        xp: profile.data.xp,
        challenges: challenges.data,
      },
      fetchedAt: new Date(),
    };
  }
}
