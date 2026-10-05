import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';

@Injectable()
export class CallingCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
  ) {}

  async list(userId: string, gameId?: string) {
    const gid = gameId ?? (await this.catalog.getActiveGame()).id;
    const cards = await this.prisma.callingCard.findMany({
      where: { gameId: gid },
      include: { challenges: { include: { progress: { where: { userId } } } } },
    });
    return cards.map((card) => {
      const challenges = card.challenges.map((c) => {
        const p = c.progress[0];
        const current = p?.currentValue ?? 0;
        return {
          id: c.id,
          description: c.description,
          requirementType: c.requirementType,
          targetValue: c.targetValue,
          currentValue: current,
          completed: p?.completed ?? current >= c.targetValue,
          source: p?.source ?? 'CALCULATED',
          progressPct: c.targetValue ? Math.min(100, Math.round((current / c.targetValue) * 100)) : 0,
        };
      });
      const completed = challenges.filter((c) => c.completed).length;
      return {
        id: card.id,
        name: card.name,
        category: card.category,
        description: card.description,
        imageUrl: card.imageUrl,
        completed,
        total: challenges.length,
        completionPct: challenges.length ? Math.round((completed / challenges.length) * 100) : 0,
        unlocked: challenges.length > 0 && completed === challenges.length,
        challenges,
      };
    });
  }

  async detail(userId: string, id: string) {
    const card = await this.prisma.callingCard.findUnique({
      where: { id },
      include: { challenges: { include: { progress: { where: { userId } } } } },
    });
    if (!card) throw new NotFoundException('Calling card not found');
    return card;
  }

  async updateProgress(userId: string, challengeId: string, currentValue: number) {
    const challenge = await this.prisma.callingCardChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Calling card challenge not found');
    const completed = currentValue >= challenge.targetValue;
    return this.prisma.callingCardProgress.upsert({
      where: { userId_challengeId: { userId, challengeId } },
      create: { userId, challengeId, currentValue, completed, source: 'MANUAL' },
      update: { currentValue, completed, source: 'MANUAL' },
    });
  }
}
