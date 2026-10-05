import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Platform } from '@prisma/client';
import { Request } from 'express';
import { AccountsService } from './accounts.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

class LinkAccountBody {
  @IsOptional() @IsString() providerKey?: string;
  @IsOptional() @IsString() activisionUsername?: string;
  @IsOptional() @IsEnum(Platform) platform?: Platform;
  @IsOptional() @IsString() platformUsername?: string;
  @IsOptional() @IsString() platformAccountId?: string;
}

@ApiTags('accounts')
@ApiBearerAuth()
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.accounts.list(user.id);
  }

  @Get('sync-status')
  syncStatus(@CurrentUser() user: AuthUser) {
    return this.accounts.syncStatus(user.id);
  }

  @Get('providers')
  providers() {
    // Exposed for the client to render provider choices (no secrets involved).
    return [
      { key: 'mock', name: 'Mock Provider (demo data)', available: true },
      { key: 'manual', name: 'Manual Entry', available: true },
      { key: 'ocr', name: 'Screenshot / OCR', available: true },
      { key: 'activision', name: 'Activision (not yet available)', available: false },
    ];
  }

  @Post()
  link(@CurrentUser() user: AuthUser, @Body() dto: LinkAccountBody, @Req() req: Request) {
    return this.accounts.link(user.id, dto, req.ip);
  }

  @Delete(':id')
  unlink(@CurrentUser() user: AuthUser, @Param('id') id: string, @Req() req: Request) {
    return this.accounts.unlink(user.id, id, req.ip);
  }
}
