import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Admin content management API. Every route is guarded by the global JwtAuthGuard
 * plus the RolesGuard (@Roles('ADMIN')). Game content is data-driven: adding a
 * weapon/camo/event here immediately surfaces in the mobile app with no release.
 */
@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Overview ───────────────────────────────────────────────────────────
  @Get('overview')
  async overview() {
    const [games, seasons, weapons, camoSets, camos, camoChallenges, callingCards, events, matches] =
      await Promise.all([
        this.prisma.game.count(),
        this.prisma.season.count(),
        this.prisma.weapon.count(),
        this.prisma.camoSet.count(),
        this.prisma.camo.count(),
        this.prisma.camoChallenge.count(),
        this.prisma.callingCard.count(),
        this.prisma.event.count(),
        this.prisma.match.count(),
      ]);
    return { games, seasons, weapons, camoSets, camos, camoChallenges, callingCards, events, matches };
  }

  // ── Games ──────────────────────────────────────────────────────────────
  @Post('games')
  createGame(@Body() body: any) {
    return this.admin.createGame(body);
  }
  @Patch('games/:id')
  updateGame(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateGame(id, body);
  }
  @Delete('games/:id')
  deleteGame(@Param('id') id: string) {
    return this.admin.deleteGame(id);
  }

  // ── Seasons ────────────────────────────────────────────────────────────
  @Post('seasons')
  createSeason(@Body() body: any) {
    return this.admin.createSeason(body);
  }
  @Patch('seasons/:id')
  updateSeason(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateSeason(id, body);
  }
  @Delete('seasons/:id')
  deleteSeason(@Param('id') id: string) {
    return this.admin.deleteSeason(id);
  }

  // ── Weapons & levels ───────────────────────────────────────────────────
  @Post('weapons')
  createWeapon(@Body() body: any) {
    return this.admin.createWeapon(body);
  }
  @Patch('weapons/:id')
  updateWeapon(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateWeapon(id, body);
  }
  @Delete('weapons/:id')
  deleteWeapon(@Param('id') id: string) {
    return this.admin.deleteWeapon(id);
  }
  @Post('weapon-levels')
  createWeaponLevel(@Body() body: any) {
    return this.admin.createWeaponLevel(body);
  }
  @Patch('weapon-levels/:id')
  updateWeaponLevel(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateWeaponLevel(id, body);
  }
  @Delete('weapon-levels/:id')
  deleteWeaponLevel(@Param('id') id: string) {
    return this.admin.deleteWeaponLevel(id);
  }

  // ── Camo sets / camos / challenges ─────────────────────────────────────
  @Post('camo-sets')
  createCamoSet(@Body() body: any) {
    return this.admin.createCamoSet(body);
  }
  @Patch('camo-sets/:id')
  updateCamoSet(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateCamoSet(id, body);
  }
  @Delete('camo-sets/:id')
  deleteCamoSet(@Param('id') id: string) {
    return this.admin.deleteCamoSet(id);
  }
  @Post('camos')
  createCamo(@Body() body: any) {
    return this.admin.createCamo(body);
  }
  @Patch('camos/:id')
  updateCamo(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateCamo(id, body);
  }
  @Delete('camos/:id')
  deleteCamo(@Param('id') id: string) {
    return this.admin.deleteCamo(id);
  }
  @Post('camo-challenges')
  createCamoChallenge(@Body() body: any) {
    return this.admin.createCamoChallenge(body);
  }
  @Patch('camo-challenges/:id')
  updateCamoChallenge(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateCamoChallenge(id, body);
  }
  @Delete('camo-challenges/:id')
  deleteCamoChallenge(@Param('id') id: string) {
    return this.admin.deleteCamoChallenge(id);
  }

  // ── Calling cards ──────────────────────────────────────────────────────
  @Post('calling-cards')
  createCallingCard(@Body() body: any) {
    return this.admin.createCallingCard(body);
  }
  @Patch('calling-cards/:id')
  updateCallingCard(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateCallingCard(id, body);
  }
  @Delete('calling-cards/:id')
  deleteCallingCard(@Param('id') id: string) {
    return this.admin.deleteCallingCard(id);
  }
  @Post('calling-card-challenges')
  createCallingCardChallenge(@Body() body: any) {
    return this.admin.createCallingCardChallenge(body);
  }
  @Patch('calling-card-challenges/:id')
  updateCallingCardChallenge(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateCallingCardChallenge(id, body);
  }
  @Delete('calling-card-challenges/:id')
  deleteCallingCardChallenge(@Param('id') id: string) {
    return this.admin.deleteCallingCardChallenge(id);
  }

  // ── Events / challenges / rewards ──────────────────────────────────────
  @Post('events')
  createEvent(@Body() body: any) {
    return this.admin.createEvent(body);
  }
  @Patch('events/:id')
  updateEvent(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateEvent(id, body);
  }
  @Delete('events/:id')
  deleteEvent(@Param('id') id: string) {
    return this.admin.deleteEvent(id);
  }
  @Post('event-challenges')
  createEventChallenge(@Body() body: any) {
    return this.admin.createEventChallenge(body);
  }
  @Patch('event-challenges/:id')
  updateEventChallenge(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateEventChallenge(id, body);
  }
  @Delete('event-challenges/:id')
  deleteEventChallenge(@Param('id') id: string) {
    return this.admin.deleteEventChallenge(id);
  }
  @Post('event-rewards')
  createEventReward(@Body() body: any) {
    return this.admin.createEventReward(body);
  }
  @Patch('event-rewards/:id')
  updateEventReward(@Param('id') id: string, @Body() body: any) {
    return this.admin.updateEventReward(id, body);
  }
  @Delete('event-rewards/:id')
  deleteEventReward(@Param('id') id: string) {
    return this.admin.deleteEventReward(id);
  }

  // ── Bulk import ────────────────────────────────────────────────────────
  @Post('import')
  import(@Body() body: any) {
    return this.admin.importContent(body);
  }
}
