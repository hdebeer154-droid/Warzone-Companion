import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { CreateMatchDto, MatchQueryDto } from './dto/matches.dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('matches')
@ApiBearerAuth()
@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: MatchQueryDto) {
    return this.matches.list(user.id, query);
  }

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.matches.stats(user.id);
  }

  @Get('recent-performance')
  recent(@CurrentUser() user: AuthUser) {
    return this.matches.recentPerformance(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMatchDto) {
    return this.matches.createManual(user.id, dto);
  }

  @Get(':id')
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.matches.detail(user.id, id);
  }
}
