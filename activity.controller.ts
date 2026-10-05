import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('activity')
@ApiBearerAuth()
@Controller('activity')
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.activity.list(user.id, Number(page ?? 1), Number(pageSize ?? 20), unreadOnly === 'true');
  }

  @Get('unread-count')
  unread(@CurrentUser() user: AuthUser) {
    return this.activity.unreadCount(user.id);
  }

  @Post(':id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.activity.markRead(user.id, id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.activity.markAllRead(user.id);
  }
}
