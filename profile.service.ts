import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchesService } from '../matches/matches.service';
import { AccountsService } from '../accounts/accounts.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matches: MatchesService,
    private readonly accounts: AccountsService,
  ) {}

  async get(userId: string) {
    const [user, stats, syncStatus, recent] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { playerProfile: true, accounts: true },
      }),
      this.matches.stats(userId),
      this.accounts.syncStatus(userId),
      this.matches.recentPerformance(userId, 10),
    ]);
    if (!user) return null;
    const { passwordHash, ...safe } = user as any;
    const profile = user.playerProfile;
    const kd = stats.deaths ? Number((stats.kills / stats.deaths).toFixed(2)) : stats.kills;

    return {
      identity: {
        id: safe.id,
        email: safe.email,
        username: safe.username,
        displayName: safe.displayName,
        avatarUrl: safe.avatarUrl,
        role: safe.role,
      },
      player: {
        level: profile?.level ?? 1,
        prestige: profile?.prestige ?? 0,
        xp: profile?.xp ?? 0,
      },
      codUsername: user.accounts[0]?.activisionUsername ?? safe.username,
      platform: user.accounts[0]?.platform ?? 'UNKNOWN',
      stats: { ...stats, kd },
      recentPerformance: recent,
      accounts: user.accounts.map((a) => ({
        id: a.id,
        providerKey: a.providerKey,
        platform: a.platform,
        activisionUsername: a.activisionUsername,
        linkedAt: a.linkedAt,
      })),
      sync: syncStatus,
    };
  }
}
