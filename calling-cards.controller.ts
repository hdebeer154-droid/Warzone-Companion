import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { CallingCardsService } from './calling-cards.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

class UpdateCcProgressDto {
  @Type(() => Number) @IsInt() @Min(0) currentValue!: number;
}

@ApiTags('calling-cards')
@ApiBearerAuth()
@Controller('calling-cards')
export class CallingCardsController {
  constructor(private readonly cards: CallingCardsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('gameId') gameId?: string) {
    return this.cards.list(user.id, gameId);
  }

  @Get(':id')
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cards.detail(user.id, id);
  }

  @Patch('challenges/:challengeId')
  update(@CurrentUser() user: AuthUser, @Param('challengeId') challengeId: string, @Body() dto: UpdateCcProgressDto) {
    return this.cards.updateProgress(user.id, challengeId, dto.currentValue);
  }
}
