import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listGames(activeOnly = true) {
    return this.prisma.game.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { releaseDate: 'desc' },
      include: { seasons: { orderBy: { seasonNumber: 'desc' } } },
    });
  }

  async getGame(slug: string) {
    const game = await this.prisma.game.findUnique({
      where: { slug },
      include: { seasons: { orderBy: { seasonNumber: 'desc' } } },
    });
    if (!game) throw new NotFoundException(`Game '${slug}' not found`);
    return game;
  }

  /** The default active game used when a request does not specify one. */
  async getActiveGame() {
    const game =
      (await this.prisma.game.findFirst({ where: { active: true }, orderBy: { releaseDate: 'desc' } })) ??
      (await this.prisma.game.findFirst());
    if (!game) throw new NotFoundException('No games configured. Run the seed/import.');
    return game;
  }

  async listSeasons(gameId?: string) {
    return this.prisma.season.findMany({
      where: gameId ? { gameId } : undefined,
      orderBy: [{ seasonNumber: 'desc' }],
    });
  }

  async getActiveSeason(gameId: string) {
    return this.prisma.season.findFirst({
      where: { gameId, active: true },
      orderBy: { seasonNumber: 'desc' },
    });
  }
}
