import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import { paginate } from '../common/dto/pagination.dto';
import { CreateMatchDto, MatchQueryDto } from './dto/matches.dto';

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
  ) {}

  async list(userId: string, q: MatchQueryDto) {
    const where: Prisma.MatchWhereInput = {
      userId,
      ...(q.mode ? { mode: q.mode } : {}),
      ...(q.map ? { map: q.map } : {}),
      ...(q.from || q.to
        ? { startedAt: { ...(q.from ? { gte: new Date(q.from) } : {}), ...(q.to ? { lte: new Date(q.to) } : {}) } }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.match.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { weaponStats: { include: { weapon: { select: { id: true, name: true, slug: true, category: true } } } } },
      }),
      this.prisma.match.count({ where }),
    ]);
    return paginate(
      items.map((m) => this.toView(m)),
      total,
      q.page,
      q.pageSize,
    );
  }

  async detail(userId: string, id: string) {
    const match = await this.prisma.match.findFirst({
      where: { id, userId },
      include: { weaponStats: { include: { weapon: true } } },
    });
    if (!match) throw new NotFoundException('Match not found');
    return { ...this.toView(match), rawData: match.rawData };
  }

  async stats(userId: string) {
    const agg = await this.prisma.match.aggregate({
      where: { userId },
      _count: { _all: true },
      _sum: { kills: true, deaths: true, assists: true, damage: true, xp: true },
      _avg: { placement: true },
    });
    const wins = await this.prisma.match.count({ where: { userId, placement: 1 } });
    const top5 = await this.prisma.match.count({ where: { userId, placement: { lte: 5 } } });
    const kills = agg._sum.kills ?? 0;
    const deaths = agg._sum.deaths ?? 0;
    return {
      totalMatches: agg._count._all,
      wins,
      top5,
      kills,
      deaths,
      assists: agg._sum.assists ?? 0,
      damage: agg._sum.damage ?? 0,
      xp: agg._sum.xp ?? 0,
      kd: deaths ? Number((kills / deaths).toFixed(2)) : kills,
      winRate: agg._count._all ? Number(((wins / agg._count._all) * 100).toFixed(1)) : 0,
      avgPlacement: agg._avg.placement ? Number(agg._avg.placement.toFixed(1)) : null,
    };
  }

  /** Rolling recent form (last N matches) for the profile screen. */
  async recentPerformance(userId: string, limit = 10) {
    const matches = await this.prisma.match.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      select: { id: true, kills: true, deaths: true, placement: true, damage: true, xp: true, mode: true, map: true, startedAt: true },
    });
    const kills = matches.reduce((s, m) => s + m.kills, 0);
    const deaths = matches.reduce((s, m) => s + m.deaths, 0);
    const wins = matches.filter((m) => m.placement === 1).length;
    return {
      matches,
      summary: {
        count: matches.length,
        kills,
        deaths,
        kd: deaths ? Number((kills / deaths).toFixed(2)) : kills,
        wins,
        avgKills: matches.length ? Number((kills / matches.length).toFixed(1)) : 0,
      },
    };
  }

  async createManual(userId: string, dto: CreateMatchDto) {
    const game = await this.catalog.getActiveGame();
    return this.prisma.match.create({
      data: {
        userId,
        gameId: game.id,
        externalMatchId: dto.externalMatchId ?? `manual-${Date.now()}`,
        mode: dto.mode,
        map: dto.map,
        playlist: dto.playlist,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : new Date(),
        endedAt: dto.endedAt ? new Date(dto.endedAt) : undefined,
        kills: dto.kills ?? 0,
        deaths: dto.deaths ?? 0,
        assists: dto.assists ?? 0,
        placement: dto.placement,
        damage: dto.damage ?? 0,
        xp: dto.xp ?? 0,
        rawData: { source: 'manual' },
      },
    });
  }

  private toView(m: any) {
    return {
      id: m.id,
      externalMatchId: m.externalMatchId,
      mode: m.mode,
      map: m.map,
      playlist: m.playlist,
      startedAt: m.startedAt,
      endedAt: m.endedAt,
      kills: m.kills,
      deaths: m.deaths,
      assists: m.assists,
      placement: m.placement,
      damage: m.damage,
      xp: m.xp,
      kd: m.deaths ? Number((m.kills / m.deaths).toFixed(2)) : m.kills,
      weaponStats: (m.weaponStats ?? []).map((ws: any) => ({
        weapon: ws.weapon ? { id: ws.weapon.id, name: ws.weapon.name, slug: ws.weapon.slug, category: ws.weapon.category } : null,
        kills: ws.kills,
        headshots: ws.headshots,
        damage: ws.damage,
      })),
    };
  }
}
