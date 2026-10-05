import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get('games')
  games(@Query('activeOnly') activeOnly?: string) {
    return this.catalog.listGames(activeOnly !== 'false');
  }

  @Public()
  @Get('games/:slug')
  game(@Param('slug') slug: string) {
    return this.catalog.getGame(slug);
  }

  @Public()
  @Get('seasons')
  seasons(@Query('gameId') gameId?: string) {
    return this.catalog.listSeasons(gameId);
  }
}
