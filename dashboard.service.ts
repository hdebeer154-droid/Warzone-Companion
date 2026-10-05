import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ObjectivesService } from '../objectives/objectives.service';
import { WeaponsService } from '../weapons/weapons.service';
import { CamosService } from '../camos/camos.service';
import { CallingCardsService } from '../calling-cards/calling-cards.service';
import { EventsService } from '../events/events.service';
import { ActivityService } from '../activity/activity.service';
import { AccountsService } from '../accounts/accounts.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly objectives: ObjectivesService,
    private readonly weapons: WeaponsService,
    private readonly camos: CamosService,
    private readonly callingCards: CallingCardsService,
    private readonly events: EventsService,
    private readonly activity: ActivityService,
    private readonly accounts: AccountsService,
  ) {}

  async get(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { playerProfile: true },
    });
    const profile = user?.playerProfile;

    const [camoOverview, ccList, eventList, objectivesRes, activityRes, syncStatus] = await Promise.all([
      this.camos.overview(userId),
      this.callingCards.list(userId),
      this.events.list(userId),
      this.objectives.list(userId, 5),
      this.activity.list(userId, 1, 8),
      this.accounts.syncStatus(userId),
    ]);

    // Overall progression = weighted blend of camo, calling cards and events.
    const ccTotal = ccList.reduce((s, c) => s + c.total, 0);
    const ccDone = ccList.reduce((s, c) => s + c.completed, 0);
    const evTotal = eventList.reduce((s, e) => s + e.total, 0);
    const evDone = eventList.reduce((s, e) => s + e.completed, 0);
    const parts = [
      { pct: camoOverview.overall.completionPct, weight: 0.6 },
      { pct: ccTotal ? Math.round((ccDone / ccTotal) * 100) : 0, weight: 0.25 },
      { pct: evTotal ? Math.round((evDone / evTotal) * 100) : 0, weight: 0.15 },
    ];
    const overallProgressionPct = Math.round(parts.reduce((s, p) => s + p.pct * p.weight, 0));

    // Featured weapon: the one most relevant to current objectives, else favourite/highest level.
    const featuredObjective = objectivesRes.objectives.find((o) => o.weaponId);
    let weaponCard: any = null;
    if (featuredObjective?.weaponId) {
      const w = await this.weapons.detail(userId, featuredObjective.weaponId);
      weaponCard = {
        id: w.id,
        name: w.name,
        category: w.category,
        imageUrl: w.imageUrl,
        level: w.level,
        nextLevel: Math.min(w.maxLevel, w.level + 1),
        levelProgressPct: w.levelProgressPct,
        xpToNextLevel: w.xpToNextLevel,
        camoCompletionPct: w.camoCompletionPct,
      };
    } else {
      const list = await this.weapons.list(userId, { sort: 'favourite', order: 'desc', page: 1, pageSize: 1 } as any);
      const w = list.items[0];
      if (w) {
        weaponCard = {
          id: w.id,
          name: w.name,
          category: w.category,
          imageUrl: w.imageUrl,
          level: w.level,
          nextLevel: Math.min(w.maxLevel, w.level + 1),
          levelProgressPct: w.levelProgressPct,
          xpToNextLevel: w.xpToNextLevel,
          camoCompletionPct: w.camoCompletionPct,
        };
      }
    }

    // Featured calling card (nearest to completion, not yet unlocked).
    const featuredCard = [...ccList]
      .filter((c) => c.total > 0)
      .sort((a, b) => b.completionPct - a.completionPct)[0] ?? null;

    const featuredEvent = eventList[0] ?? null;

    return {
      header: {
        appName: 'WARZONE COMPANION',
        displayName: user?.displayName ?? user?.username ?? 'Operator',
        username: user?.username,
        avatarUrl: user?.avatarUrl ?? null,
        playerLevel: profile?.level ?? 1,
        prestige: profile?.prestige ?? 0,
        overallProgressionPct,
      },
      nextObjectives: objectivesRes.objectives,
      weaponCard,
      callingCard: featuredCard
        ? { id: featuredCard.id, name: featuredCard.name, completed: featuredCard.completed, total: featuredCard.total, completionPct: featuredCard.completionPct }
        : null,
      event: featuredEvent
        ? { id: featuredEvent.id, name: featuredEvent.name, completionPct: featuredEvent.completionPct, timeRemaining: featuredEvent.timeRemaining, endDate: featuredEvent.endDate }
        : null,
      recentActivity: activityRes.items,
      sync: syncStatus[0] ?? { syncStatus: 'NEVER', lastSyncHuman: 'Never synchronized' },
    };
  }
}
