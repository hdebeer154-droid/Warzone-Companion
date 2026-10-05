import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
  ) {}

  private timeRemaining(endDate?: Date | null) {
    if (!endDate) return { ms: null, human: null, endingSoon: false };
    const ms = endDate.getTime() - Date.now();
    if (ms <= 0) return { ms: 0, human: 'Ended', endingSoon: false };
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    return { ms, human: `${days}d ${hours}h`, endingSoon: ms < 3 * 86400000 };
  }

  async list(userId: string, gameId?: string, includeInactive = false) {
    const gid = gameId ?? (await this.catalog.getActiveGame()).id;
    const events = await this.prisma.event.findMany({
      where: { gameId: gid, ...(includeInactive ? {} : { active: true }) },
      orderBy: { startDate: 'desc' },
      include: {
        challenges: {
          include: { reward: true, progress: { where: { userId } } },
        },
      },
    });
    return events.map((e) => {
      const challenges = e.challenges.map((c) => {
        const p = c.progress[0];
        const current = p?.currentValue ?? 0;
        return {
          id: c.id,
          name: c.name,
          description: c.description,
          requirementType: c.requirementType,
          targetValue: c.targetValue,
          currentValue: current,
          completed: p?.completed ?? current >= c.targetValue,
          progressPct: c.targetValue ? Math.min(100, Math.round((current / c.targetValue) * 100)) : 0,
          reward: c.reward ? { id: c.reward.id, name: c.reward.name, imageUrl: c.reward.imageUrl, rewardType: c.reward.rewardType } : null,
        };
      });
      const completed = challenges.filter((c) => c.completed).length;
      const total = challenges.length;
      return {
        id: e.id,
        name: e.name,
        description: e.description,
        imageUrl: e.imageUrl,
        startDate: e.startDate,
        endDate: e.endDate,
        active: e.active,
        timeRemaining: this.timeRemaining(e.endDate),
        completed,
        total,
        completionPct: total ? Math.round((completed / total) * 100) : 0,
        challenges,
      };
    });
  }

  async detail(userId: string, id: string) {
    const e = await this.prisma.event.findUnique({
      where: { id },
      include: { challenges: { include: { reward: true, progress: { where: { userId } } } } },
    });
    if (!e) throw new NotFoundException('Event not found');
    return e;
  }

  async updateProgress(userId: string, challengeId: string, currentValue: number) {
    const challenge = await this.prisma.eventChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Event challenge not found');
    const completed = currentValue >= challenge.targetValue;
    return this.prisma.eventProgress.upsert({
      where: { userId_eventChallengeId: { userId, eventChallengeId: challengeId } },
      create: { userId, eventChallengeId: challengeId, currentValue, completed, source: 'MANUAL' },
      update: { currentValue, completed, source: 'MANUAL' },
    });
  }
}
