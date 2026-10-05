import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Admin content management. Game content is fully data-driven so new weapons,
 * camos, calling cards and events can be added without an app release.
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Games ──────────────────────────────────────────────
  createGame(data: any) {
    return this.prisma.game.create({ data });
  }
  updateGame(id: string, data: any) {
    return this.prisma.game.update({ where: { id }, data });
  }
  deleteGame(id: string) {
    return this.prisma.game.delete({ where: { id } });
  }

  // ── Seasons ────────────────────────────────────────────
  createSeason(data: any) {
    return this.prisma.season.create({ data });
  }
  updateSeason(id: string, data: any) {
    return this.prisma.season.update({ where: { id }, data });
  }
  deleteSeason(id: string) {
    return this.prisma.season.delete({ where: { id } });
  }

  // ── Weapons ────────────────────────────────────────────
  createWeapon(data: any) {
    return this.prisma.weapon.create({ data });
  }
  updateWeapon(id: string, data: any) {
    return this.prisma.weapon.update({ where: { id }, data });
  }
  deleteWeapon(id: string) {
    return this.prisma.weapon.delete({ where: { id } });
  }
  createWeaponLevel(data: any) {
    return this.prisma.weaponLevel.create({ data });
  }
  updateWeaponLevel(id: string, data: any) {
    return this.prisma.weaponLevel.update({ where: { id }, data });
  }
  deleteWeaponLevel(id: string) {
    return this.prisma.weaponLevel.delete({ where: { id } });
  }

  // ── Camo sets / camos / challenges ─────────────────────
  createCamoSet(data: any) {
    return this.prisma.camoSet.create({ data });
  }
  updateCamoSet(id: string, data: any) {
    return this.prisma.camoSet.update({ where: { id }, data });
  }
  deleteCamoSet(id: string) {
    return this.prisma.camoSet.delete({ where: { id } });
  }
  createCamo(data: any) {
    return this.prisma.camo.create({ data });
  }
  updateCamo(id: string, data: any) {
    return this.prisma.camo.update({ where: { id }, data });
  }
  deleteCamo(id: string) {
    return this.prisma.camo.delete({ where: { id } });
  }
  createCamoChallenge(data: any) {
    return this.prisma.camoChallenge.create({ data });
  }
  updateCamoChallenge(id: string, data: any) {
    return this.prisma.camoChallenge.update({ where: { id }, data });
  }
  deleteCamoChallenge(id: string) {
    return this.prisma.camoChallenge.delete({ where: { id } });
  }

  // ── Calling cards ──────────────────────────────────────
  createCallingCard(data: any) {
    return this.prisma.callingCard.create({ data });
  }
  updateCallingCard(id: string, data: any) {
    return this.prisma.callingCard.update({ where: { id }, data });
  }
  deleteCallingCard(id: string) {
    return this.prisma.callingCard.delete({ where: { id } });
  }
  createCallingCardChallenge(data: any) {
    return this.prisma.callingCardChallenge.create({ data });
  }
  updateCallingCardChallenge(id: string, data: any) {
    return this.prisma.callingCardChallenge.update({ where: { id }, data });
  }
  deleteCallingCardChallenge(id: string) {
    return this.prisma.callingCardChallenge.delete({ where: { id } });
  }

  // ── Events / challenges / rewards ──────────────────────
  createEvent(data: any) {
    return this.prisma.event.create({ data });
  }
  updateEvent(id: string, data: any) {
    return this.prisma.event.update({ where: { id }, data });
  }
  deleteEvent(id: string) {
    return this.prisma.event.delete({ where: { id } });
  }
  createEventChallenge(data: any) {
    return this.prisma.eventChallenge.create({ data });
  }
  updateEventChallenge(id: string, data: any) {
    return this.prisma.eventChallenge.update({ where: { id }, data });
  }
  deleteEventChallenge(id: string) {
    return this.prisma.eventChallenge.delete({ where: { id } });
  }
  createEventReward(data: any) {
    return this.prisma.eventReward.create({ data });
  }
  updateEventReward(id: string, data: any) {
    return this.prisma.eventReward.update({ where: { id }, data });
  }
  deleteEventReward(id: string) {
    return this.prisma.eventReward.delete({ where: { id } });
  }

  // ── Bulk import ────────────────────────────────────────
  async importContent(payload: any) {
    const counts: Record<string, number> = {};
    const bump = (k: string) => (counts[k] = (counts[k] ?? 0) + 1);

    if (payload.games) {
      for (const g of payload.games) {
        await this.prisma.game.upsert({ where: { slug: g.slug }, create: g, update: g });
        bump('games');
      }
    }
    if (payload.seasons) {
      for (const s of payload.seasons) {
        await this.prisma.season.upsert({
          where: { gameId_seasonNumber: { gameId: s.gameId, seasonNumber: s.seasonNumber } },
          create: s,
          update: s,
        });
        bump('seasons');
      }
    }
    if (payload.weapons) {
      for (const w of payload.weapons) {
        await this.prisma.weapon.upsert({ where: { gameId_slug: { gameId: w.gameId, slug: w.slug } }, create: w, update: w });
        bump('weapons');
      }
    }
    if (payload.camoSets) {
      for (const cs of payload.camoSets) {
        await this.prisma.camoSet.create({ data: cs }).then(() => bump('camoSets')).catch(() => undefined);
      }
    }
    return { imported: counts };
  }
}
