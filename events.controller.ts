import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { EventsService } from './events.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

class UpdateEventProgressDto {
  @Type(() => Number) @IsInt() @Min(0) currentValue!: number;
}

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('gameId') gameId?: string, @Query('includeInactive') includeInactive?: string) {
    return this.events.list(user.id, gameId, includeInactive === 'true');
  }

  @Get(':id')
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.events.detail(user.id, id);
  }

  @Patch('challenges/:challengeId')
  update(@CurrentUser() user: AuthUser, @Param('challengeId') challengeId: string, @Body() dto: UpdateEventProgressDto) {
    return this.events.updateProgress(user.id, challengeId, dto.currentValue);
  }
}
