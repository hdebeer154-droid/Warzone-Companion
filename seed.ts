/**
 * Warzone Companion — database seed.
 *
 * Seeds:
 *   1. Game content (data-driven) from prisma/data/game-content.json
 *   2. The FENRIR demo account with realistic progression, matches, activity.
 *
 * Safe to re-run: game content is rebuilt, demo progress is regenerated.
 */
import { PrismaClient, Prisma, WeaponCategory, CamoCategory, Platform } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ── helpers ──────────────────────────────────────────────────────────────
const DAY = 86_400_000;
const HOUR = 3_600_000;
const MIN = 60_000;

const daysFromNow = (d: number) => new Date(Date.now() + d * DAY);
const hoursAgo = (h: number) => new Date(Date.now() - h * HOUR);
const minutesAgo = (m: number) => new Date(Date.now() - m * MIN);

/** Cumulative XP required to reach a given weapon level. */
function xpRequired(level: number): number {
  return Math.round(900 * (level - 1) + 60 * Math.pow(level - 1, 2));
}

/** Deterministic pseudo-random in [0,1) from a string seed. */
function det(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ── per-weapon camo completion targets (sum → ~83% overall) ───────────────
const WEAPON_COMPLETED: Record<string, number> = {
  'kilo-141': 25,
  m4a1: 25,
  'ak-47': 24,
  stg44: 22,
  mp5: 24,
  mp7: 22,
  'vaznev-9k': 20,
  'lockwood-680': 20,
  'expedite-12': 19,
  rpk: 22,
  'raal-mg': 21,
  'sp-x-80': 17,
  x12: 16,
  'combat-knife': 17,
};

// Kilo 141 specific partial progress (the demo's headline objectives).
const KILO_PARTIAL: Record<string, { current: number; target: number }> = {
  Woodland: { current: 84, target: 100 }, // headshots 84/100
  Digital: { current: 47, target: 50 }, // longshots 47/50
  Gold: { current: 10, target: 12 },
  Interstellar: { current: 120, target: 200 },
};

async function seedGameContent() {
  const contentPath = path.join(__dirname, 'data', 'game-content.json');
  const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

  // Rebuild game content (cascades to weapons/camos/challenges/matches).
  await prisma.game.deleteMany({ where: { slug: content.game.slug } });

  const game = await prisma.game.create({
    data: {
      slug: content.game.slug,
      name: content.game.name,
      version: content.game.version,
      active: content.game.active,
      releaseDate: daysFromNow(-420),
    },
  });

  // Seasons
  const seasons: Record<number, string> = {};
  for (const s of content.seasons) {
    const season = await prisma.season.create({
      data: {
        gameId: game.id,
        seasonNumber: s.seasonNumber,
        name: s.name,
        active: s.active,
        startDate: daysFromNow(s.startOffsetDays),
        endDate: daysFromNow(s.endOffsetDays),
      },
    });
    seasons[s.seasonNumber] = season.id;
  }
  const activeSeasonId = seasons[6];

  // Weapons + levels
  const weaponIdBySlug: Record<string, string> = {};
  const weaponMeta: Record<string, { name: string; maxLevel: number; category: WeaponCategory }> = {};
  for (const w of content.weapons) {
    const weapon = await prisma.weapon.create({
      data: {
        gameId: game.id,
        slug: w.slug,
        name: w.name,
        category: w.category as WeaponCategory,
        maxLevel: w.maxLevel,
        orderIndex: w.orderIndex,
        active: true,
        imageUrl: null,
      },
    });
    weaponIdBySlug[w.slug] = weapon.id;
    weaponMeta[w.slug] = { name: w.name, maxLevel: w.maxLevel, category: w.category as WeaponCategory };

    const levels: Prisma.WeaponLevelCreateManyInput[] = [];
    for (let l = 1; l <= w.maxLevel; l++) {
      levels.push({
        weaponId: weapon.id,
        level: l,
        xpRequired: xpRequired(l),
        unlockType: l % 10 === 0 ? 'attachment' : null,
      });
    }
    await prisma.weaponLevel.createMany({ data: levels });
  }

  // Camo sets + camos + challenge templates
  type CamoTemplate = { camoName: string; setId: string; description: string; requirementType: string; targetValue: number; rarity: string };
  const camoTemplates: CamoTemplate[] = [];
  for (const set of content.camoSets) {
    const camoSet = await prisma.camoSet.create({
      data: {
        gameId: game.id,
        seasonId: set.category === 'SEASONAL' ? activeSeasonId : null,
        name: set.name,
        category: set.category as CamoCategory,
        orderIndex: set.orderIndex,
      },
    });
    let camoOrder = 0;
    for (const camo of set.camos) {
      const created = await prisma.camo.create({
        data: {
          camoSetId: camoSet.id,
          name: camo.name,
          rarity: camo.rarity,
          orderIndex: camoOrder++,
          imageUrl: null,
        },
      });
      camoTemplates.push({
        camoName: camo.name,
        setId: created.id,
        description: camo.challenge.description,
        requirementType: camo.challenge.requirementType,
        targetValue: camo.challenge.targetValue,
        rarity: camo.rarity,
      });
    }
  }

  // Per-weapon camo challenges
  const challengeRows: Prisma.CamoChallengeCreateManyInput[] = [];
  for (const w of content.weapons) {
    for (const t of camoTemplates) {
      challengeRows.push({
        camoId: t.setId,
        weaponId: weaponIdBySlug[w.slug],
        description: t.description.replace('{weapon}', w.name),
        requirementType: t.requirementType,
        targetValue: t.targetValue,
        gameMode: null,
      });
    }
  }
  await prisma.camoChallenge.createMany({ data: challengeRows });

  // Calling cards + challenges
  const callingCardMeta: Record<string, { id: string; challengeIds: string[] }> = {};
  for (const card of content.callingCards) {
    const cc = await prisma.callingCard.create({
      data: {
        gameId: game.id,
        seasonId: activeSeasonId,
        name: card.name,
        category: card.category,
        description: card.description,
      },
    });
    const challengeIds: string[] = [];
    for (const ch of card.challenges) {
      const created = await prisma.callingCardChallenge.create({
        data: {
          callingCardId: cc.id,
          description: ch.description,
          requirementType: ch.requirementType,
          targetValue: ch.targetValue,
        },
      });
      challengeIds.push(created.id);
    }
    callingCardMeta[card.name] = { id: cc.id, challengeIds };
  }

  // Events + rewards + challenges
  const eventMeta: Record<string, { id: string; challengeIds: string[] }> = {};
  for (const ev of content.events) {
    const event = await prisma.event.create({
      data: {
        gameId: game.id,
        seasonId: activeSeasonId,
        name: ev.name,
        description: ev.description,
        active: ev.active,
        startDate: daysFromNow(ev.startOffsetDays),
        endDate: daysFromNow(ev.endOffsetDays),
      },
    });
    const challengeIds: string[] = [];
    for (const ch of ev.challenges) {
      let rewardId: string | undefined;
      if (ch.reward) {
        const reward = await prisma.eventReward.create({
          data: { name: ch.reward.name, rewardType: ch.reward.rewardType },
        });
        rewardId = reward.id;
      }
      const created = await prisma.eventChallenge.create({
        data: {
          eventId: event.id,
          name: ch.name,
          description: ch.description,
          requirementType: ch.requirementType,
          targetValue: ch.targetValue,
          rewardId,
        },
      });
      challengeIds.push(created.id);
    }
    eventMeta[ev.name] = { id: event.id, challengeIds };
  }

  return {
    game,
    activeSeasonId,
    weaponIdBySlug,
    weaponMeta,
    callingCardMeta,
    eventMeta,
    camoCount: camoTemplates.length,
  };
}

async function seedDemoUser(ctx: Awaited<ReturnType<typeof seedGameContent>>) {
  const email = (process.env.DEMO_EMAIL ?? 'fenrir@warzone.gg').toLowerCase();
  const password = process.env.DEMO_PASSWORD ?? 'Fenrir#2025';
  const passwordHash = await bcrypt.hash(password, 12);

  // Clean previous demo state (keeps it re-runnable).
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.activityEvent.deleteMany({ where: { userId: existing.id } });
    await prisma.userObjective.deleteMany({ where: { userId: existing.id } });
    await prisma.match.deleteMany({ where: { userId: existing.id } });
    await prisma.codAccount.deleteMany({ where: { userId: existing.id } });
  }

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      username: 'FENRIR',
      displayName: 'FENRIR',
      passwordHash,
      role: 'USER',
      notificationPref: {
        create: [
          'CAMO_COMPLETED',
          'WEAPON_LEVEL',
          'EVENT_ENDING_SOON',
          'CHALLENGE_COMPLETED',
          'NEW_EVENT',
          'NEW_SEASON',
          'SYNC_FAILURE',
        ].map((category) => ({ category: category as any, enabled: true })),
      },
    },
    update: { displayName: 'FENRIR', username: 'FENRIR', passwordHash },
  });

  // ── Player profile (Level 47, Prestige 3) ──
  await prisma.playerProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      level: 47,
      prestige: 3,
      xp: 184_500,
      totalMatches: 612,
      wins: 71,
      kills: 8_420,
      deaths: 7_310,
      assists: 3_120,
      damage: BigInt(2_650_000),
    },
    update: {
      level: 47,
      prestige: 3,
      xp: 184_500,
      totalMatches: 612,
      wins: 71,
      kills: 8_420,
      deaths: 7_310,
      assists: 3_120,
      damage: BigInt(2_650_000),
    },
  });

  // ── Linked COD account (mock provider, synced 37 minutes ago) ──
  const account = await prisma.codAccount.create({
    data: {
      userId: user.id,
      providerKey: 'mock',
      activisionUserId: 'fenrir-7734210',
      activisionUsername: 'FENRIR#7734210',
      platform: 'BATTLENET' as Platform,
      platformUsername: 'FENRIR',
      platformAccountId: '7734210',
      syncStatus: 'OK',
      lastSyncAt: minutesAgo(37),
      lastSyncCursor: '12',
    },
  });
  await prisma.playerProfile.update({ where: { userId: user.id }, data: { codAccountId: account.id } });

  // ── Weapon progress ──
  for (const [slug, weaponId] of Object.entries(ctx.weaponIdBySlug)) {
    const meta = ctx.weaponMeta[slug];
    let level: number;
    let xp: number;
    if (slug === 'kilo-141') {
      level = 38;
      xp = Math.round(xpRequired(38) + 0.6 * (xpRequired(39) - xpRequired(38)));
    } else {
      level = clamp(Math.round(meta.maxLevel * (0.35 + 0.55 * det(slug + 'lvl'))), 1, meta.maxLevel);
      const base = xpRequired(level);
      const next = xpRequired(Math.min(meta.maxLevel, level + 1));
      xp = Math.round(base + det(slug + 'xp') * Math.max(1, next - base));
    }
    const r = det(slug + 'kills');
    await prisma.weaponProgress.create({
      data: {
        userId: user.id,
        weaponId,
        level,
        xp,
        kills: slug === 'kilo-141' ? 1_437 : 80 + Math.floor(r * 1_400),
        headshots: slug === 'kilo-141' ? 214 : 15 + Math.floor(r * 300),
        matches: slug === 'kilo-141' ? 128 : 12 + Math.floor(r * 160),
        source: 'API',
      },
    });
  }

  // Favourites
  for (const slug of ['kilo-141', 'mp5', 'sp-x-80']) {
    await prisma.weaponFavorite.create({ data: { userId: user.id, weaponId: ctx.weaponIdBySlug[slug] } });
  }

  // ── Camo progress ──
  const challenges = await prisma.camoChallenge.findMany({
    where: { weapon: { gameId: ctx.game.id } },
    include: { weapon: { select: { slug: true } }, camo: { select: { name: true } } },
  });
  // Group by weapon slug, preserving camo order.
  const byWeapon = new Map<string, typeof challenges>();
  for (const c of challenges) {
    const arr = byWeapon.get(c.weapon.slug) ?? [];
    arr.push(c);
    byWeapon.set(c.weapon.slug, arr);
  }

  const camoRows: Prisma.CamoProgressCreateManyInput[] = [];
  for (const [slug, list] of byWeapon.entries()) {
    const completedTarget = WEAPON_COMPLETED[slug] ?? 0;
    list.forEach((c, idx) => {
      let current: number;
      let completed: boolean;
      if (slug === 'kilo-141' && KILO_PARTIAL[c.camo.name]) {
        const p = KILO_PARTIAL[c.camo.name];
        current = p.current;
        completed = current >= (p.target ?? c.targetValue);
      } else if (idx < completedTarget) {
        current = c.targetValue;
        completed = true;
      } else {
        current = Math.round(c.targetValue * (0.1 + 0.25 * det(slug + c.camo.name)));
        completed = false;
      }
      camoRows.push({
        userId: user.id,
        camoChallengeId: c.id,
        currentValue: current,
        targetValue: c.targetValue,
        completed,
        source: 'API',
      });
    });
  }
  await prisma.camoProgress.createMany({ data: camoRows });

  // ── Calling card progress ──
  const CC_COMPLETED: Record<string, number> = {
    'Warzone Veteran': 7,
    Marksman: 3,
    Demolition: 4,
    Survivor: 2,
    Tactician: 5,
    Ghost: 2,
  };
  for (const [name, meta] of Object.entries(ctx.callingCardMeta)) {
    const done = CC_COMPLETED[name] ?? 0;
    const challengesForCard = await prisma.callingCardChallenge.findMany({
      where: { callingCardId: meta.id },
      orderBy: { description: 'asc' },
    });
    for (let i = 0; i < challengesForCard.length; i++) {
      const ch = challengesForCard[i];
      const completed = i < done;
      await prisma.callingCardProgress.create({
        data: {
          userId: user.id,
          challengeId: ch.id,
          currentValue: completed ? ch.targetValue : Math.round(ch.targetValue * (0.2 + 0.4 * det(name + ch.requirementType))),
          completed,
          source: 'API',
        },
      });
    }
  }

  // ── Event progress (The Haunting: 4/5 = 80%) ──
  for (const [name, meta] of Object.entries(ctx.eventMeta)) {
    const challengesForEvent = await prisma.eventChallenge.findMany({
      where: { eventId: meta.id },
      orderBy: { name: 'asc' },
    });
    // Complete all but the last (Final Ritual) → 4/5.
    for (let i = 0; i < challengesForEvent.length; i++) {
      const ch = challengesForEvent[i];
      const isLast = i === challengesForEvent.length - 1;
      const completed = !isLast;
      await prisma.eventProgress.create({
        data: {
          userId: user.id,
          eventChallengeId: ch.id,
          currentValue: completed ? ch.targetValue : Math.max(0, ch.targetValue - 1),
          completed,
          source: 'API',
        },
      });
    }
  }

  // ── Matches (12 sample matches) ──
  const maps = ['Verdansk', 'Rebirth Island', 'Urzikstan', 'Ashika Island', 'Fortunes Keep'];
  const modes = ['Battle Royale', 'Resurgence', 'Plunder', 'Lockdown'];
  const playlists = ['BR Quads', 'Resurgence Trios', 'BR Solos', 'Plunder Quads'];
  const weaponSlugs = Object.keys(ctx.weaponIdBySlug);

  for (let i = 0; i < 12; i++) {
    const r = det('match' + i);
    const r2 = det('match2' + i);
    const r3 = det('match3' + i);
    const kills = 3 + Math.floor(r * 18);
    const deaths = 1 + Math.floor(r2 * 6);
    const placement = 1 + Math.floor(r3 * 28);
    const startedAt = hoursAgo(i * 5 + r * 3);
    const match = await prisma.match.create({
      data: {
        userId: user.id,
        gameId: ctx.game.id,
        externalMatchId: `seed-match-${i}`,
        mode: modes[Math.floor(r * modes.length)],
        map: maps[Math.floor(r2 * maps.length)],
        playlist: playlists[Math.floor(r3 * playlists.length)],
        startedAt,
        endedAt: new Date(startedAt.getTime() + 20 * MIN),
        kills,
        deaths,
        assists: Math.floor(kills * 0.5),
        placement,
        damage: kills * (250 + Math.floor(r * 400)),
        xp: 1_500 + Math.floor(r * 9_000),
        rawData: { source: 'seed' },
      },
    });
    const w1 = weaponSlugs[Math.floor(r * weaponSlugs.length)];
    const w2 = weaponSlugs[Math.floor(r2 * weaponSlugs.length)];
    await prisma.matchWeaponStat.createMany({
      data: [
        { matchId: match.id, weaponId: ctx.weaponIdBySlug[w1], kills: Math.ceil(kills * 0.6), headshots: Math.floor(kills * 0.15), damage: kills * 180 },
        { matchId: match.id, weaponId: ctx.weaponIdBySlug[w2], kills: Math.floor(kills * 0.4), headshots: Math.floor(kills * 0.08), damage: kills * 120 },
      ],
    });
  }

  // ── Activity feed (meaningful change descriptions) ──
  const activity: Prisma.ActivityEventCreateManyInput[] = [
    { userId: user.id, type: 'SYNC', title: 'Synchronization complete — 5 changes detected', description: 'Synchronization complete — 5 changes detected', createdAt: minutesAgo(37), metadata: { newMatches: 1, camoChanges: 2, weaponLevelUp: 1 } },
    { userId: user.id, type: 'CAMO_PROGRESS', title: 'Kilo 141 +12 headshots', description: 'Kilo 141 headshots increased from 72 to 84 (100 required).', createdAt: hoursAgo(2), metadata: { weaponName: 'Kilo 141', requirement: 'HEADSHOTS', from: 72, to: 84, target: 100 } },
    { userId: user.id, type: 'WEAPON_LEVEL_UP', title: 'Kilo 141 reached Level 38', description: 'Kilo 141 levelled up to Level 38.', createdAt: hoursAgo(5), metadata: { weaponName: 'Kilo 141', level: 38 } },
    { userId: user.id, type: 'MATCH_COMPLETED', title: '17 kills • #1 (WIN)', description: 'Resurgence on Rebirth Island — 17 kills, placed #1.', createdAt: hoursAgo(6), metadata: { kills: 17, placement: 1 } },
    { userId: user.id, type: 'CAMO_PROGRESS', title: 'Kilo 141 +3 longshots', description: 'Kilo 141 longshots increased from 44 to 47 (50 required).', createdAt: hoursAgo(20), metadata: { weaponName: 'Kilo 141', requirement: 'LONGSHOTS', from: 44, to: 47, target: 50 } },
    { userId: user.id, type: 'CALLING_CARD_PROGRESS', title: 'Warzone Veteran +2', description: 'Calling card "Warzone Veteran" progressed from 5 to 7.', createdAt: hoursAgo(26), metadata: { cardName: 'Warzone Veteran', from: 5, to: 7, target: 10 } },
    { userId: user.id, type: 'EVENT_PROGRESS', title: 'Event challenge complete: Survivor\'s Curse', description: 'The Haunting: "Survivor\'s Curse" progressed from 8 to 10 (10 required).', createdAt: hoursAgo(30), metadata: { eventName: 'The Haunting', challengeName: "Survivor's Curse", from: 8, to: 10, target: 10 } },
    { userId: user.id, type: 'MATCH_COMPLETED', title: '9 kills • #4', description: 'Battle Royale on Urzikstan — 9 kills, placed #4.', createdAt: hoursAgo(48), metadata: { kills: 9, placement: 4 } },
  ];
  await prisma.activityEvent.createMany({ data: activity });

  // ── Objectives: generated lazily by the API on first load. ──

  return { user, account };
}

async function main() {
  console.log('▶ Seeding Warzone Companion…');
  const ctx = await seedGameContent();
  console.log(`  ✓ Game content: ${Object.keys(ctx.weaponIdBySlug).length} weapons, ${ctx.camoCount} camos, ${Object.keys(ctx.callingCardMeta).length} calling cards, ${Object.keys(ctx.eventMeta).length} event(s)`);

  const demo = await seedDemoUser(ctx);
  console.log(`  ✓ Demo user: ${demo.user.username} (${demo.user.email})`);

  // Provider health rows
  for (const key of ['mock', 'manual', 'ocr', 'activision']) {
    await prisma.providerHealth.upsert({
      where: { providerKey: key },
      create: { providerKey: key, healthy: key !== 'activision', latencyMs: key === 'mock' ? 42 : null, lastError: key === 'activision' ? 'Activision provider disabled (no legitimate public API configured)' : null },
      update: {},
    });
  }

  console.log('✔ Seed complete.');
  console.log(`  Login: ${demo.user.email} / ${process.env.DEMO_PASSWORD ?? 'Fenrir#2025'}`);
}

main()
  .catch((e) => {
    console.error('✖ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
