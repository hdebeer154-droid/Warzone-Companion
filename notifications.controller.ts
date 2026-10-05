import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { NotificationCategory } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

class SetPrefDto {
  @IsEnum(NotificationCategory) category!: NotificationCategory;
  @IsBoolean() enabled!: boolean;
}

class PushTokenDto {
  @IsString() token!: string;
  @IsOptional() @IsString() platform?: string;
}

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('preferences')
  prefs(@CurrentUser() user: AuthUser) {
    return this.notifications.getPreferences(user.id);
  }

  @Patch('preferences')
  setPref(@CurrentUser() user: AuthUser, @Body() dto: SetPrefDto) {
    return this.notifications.setPreference(user.id, dto.category, dto.enabled);
  }

  @Post('push-token')
  register(@CurrentUser() user: AuthUser, @Body() dto: PushTokenDto) {
    return this.notifications.registerPushToken(user.id, dto.token, dto.platform);
  }

  @Delete('push-token')
  remove(@CurrentUser() user: AuthUser, @Body() dto: PushTokenDto) {
    return this.notifications.removePushToken(user.id, dto.token);
  }
}
