import { Injectable } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination.dto';

/**
 * Activity feed. The feed describes *meaningful changes* rather than raw stats,
 * e.g. "Kilo 141 headshots increased from 72 to 84." instead of "Headshots: 84".
 */
@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: {
    userId: string;
    type: ActivityType;
    title: string;
    description?: string;
    metadata?: Record<string, any>;
  }) {
    return this.prisma.activityEvent.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        description: params.description,
        metadata: params.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async recordCamoProgress(userId: string, weaponName: string, requirement: string, from: number, to: number, target: number) {
    const label = requirement.replace(/_/g, ' ').toLowerCase();
    const completed = to >= target;
    return this.record({
      userId,
      type: completed ? 'CAMO_COMPLETED' : 'CAMO_PROGRESS',
      title: completed ? `${weaponName} — ${label} complete` : `${weaponName} +${to - from} ${label}`,
      description: completed
        ? `${weaponName} ${label} reached ${to}/${target}.`
        : `${weaponName} ${label} increased from ${from} to ${to} (${target} required).`,
      metadata: { weaponName, requirement, from, to, target },
    });
  }

  async recordWeaponLevelUp(userId: string, weaponName: string, level: number) {
    return this.record({
      userId,
      type: 'WEAPON_LEVEL_UP',
      title: `${weaponName} reached Level ${level}`,
      description: `${weaponName} levelled up to Level ${level}.`,
      metadata: { weaponName, level },
    });
  }

  async recordMatchCompleted(userId: string, match: { kills: number; placement?: number | null; mode?: string | null; map?: string | null; id: string }) {
    const place = match.placement ? `#${match.placement}` : 'unranked';
    return this.record({
      userId,
      type: 'MATCH_COMPLETED',
      title: `${match.kills} kills • ${place}${match.placement === 1 ? ' (WIN)' : ''}`,
      description: `${match.mode ?? 'Match'} on ${match.map ?? 'unknown map'} — ${match.kills} kills, placed ${place}.`,
      metadata: { matchId: match.id, kills: match.kills, placement: match.placement },
    });
  }

  async recordCallingCardProgress(userId: string, cardName: string, from: number, to: number, target: number) {
    const completed = to >= target;
    return this.record({
      userId,
      type: completed ? 'CALLING_CARD_COMPLETED' : 'CALLING_CARD_PROGRESS',
      title: completed ? `Calling card unlocked: ${cardName}` : `${cardName} +${to - from}`,
      description: completed
        ? `Calling card "${cardName}" unlocked (${to}/${target}).`
        : `Calling card "${cardName}" progressed from ${from} to ${to}.`,
      metadata: { cardName, from, to, target },
    });
  }

  async recordEventProgress(userId: string, eventName: string, challengeName: string, from: number, to: number, target: number) {
    const completed = to >= target;
    return this.record({
      userId,
      type: completed ? 'EVENT_COMPLETED' : 'EVENT_PROGRESS',
      title: completed ? `Event challenge complete: ${challengeName}` : `${eventName} — ${challengeName} +${to - from}`,
      description: `${eventName}: "${challengeName}" progressed from ${from} to ${to} (${target} required).`,
      metadata: { eventName, challengeName, from, to, target },
    });
  }

  async recordPlayerLevelUp(userId: string, from: number, to: number) {
    return this.record({
      userId,
      type: 'PLAYER_LEVEL_UP',
      title: `Player level ${from} → ${to}`,
      description: `You reached player level ${to}.`,
      metadata: { from, to },
    });
  }

  async recordPrestige(userId: string, prestige: number) {
    return this.record({
      userId,
      type: 'PRESTIGE',
      title: `Prestige ${prestige} reached`,
      description: `You entered Prestige ${prestige}.`,
      metadata: { prestige },
    });
  }

  async recordSync(userId: string, summary: string, metadata?: Record<string, any>) {
    return this.record({ userId, type: 'SYNC', title: summary, description: summary, metadata });
  }

  async list(userId: string, page = 1, pageSize = 20, unreadOnly = false) {
    const where: Prisma.ActivityEventWhereInput = { userId, ...(unreadOnly ? { readAt: null } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.activityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.activityEvent.count({ where }),
    ]);
    return paginate(items, total, page, pageSize);
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.activityEvent.count({ where: { userId, readAt: null } });
    return { unread: count };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.activityEvent.updateMany({ where: { id, userId }, data: { readAt: new Date() } });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.activityEvent.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { success: true };
  }
}
