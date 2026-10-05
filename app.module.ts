import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import configuration from './config/configuration';

// Infrastructure
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { QueueModule } from './queue/queue.module';
import { AuditModule } from './audit/audit.module';
import { ProvidersModule } from './providers/providers.module';

// Domain
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { WeaponsModule } from './weapons/weapons.module';
import { CamosModule } from './camos/camos.module';
import { CallingCardsModule } from './calling-cards/calling-cards.module';
import { EventsModule } from './events/events.module';
import { MatchesModule } from './matches/matches.module';
import { ActivityModule } from './activity/activity.module';
import { ObjectivesModule } from './objectives/objectives.module';
import { AccountsModule } from './accounts/accounts.module';
import { ProfileModule } from './profile/profile.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OcrModule } from './ocr/ocr.module';
import { SyncModule } from './sync/sync.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';

// Cross-cutting
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    // ── Config (global) ──
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env'],
    }),

    // ── Rate limiting (global) ──
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 120 },
    ]),

    // ── Scheduled jobs ──
    ScheduleModule.forRoot(),

    // ── Infrastructure (all @Global) ──
    PrismaModule,
    RedisModule,
    StorageModule,
    QueueModule,
    AuditModule,
    ProvidersModule,

    // ── Domain modules ──
    AuthModule,
    CatalogModule,
    WeaponsModule,
    CamosModule,
    CallingCardsModule,
    EventsModule,
    MatchesModule,
    ActivityModule,
    ObjectivesModule,
    AccountsModule,
    ProfileModule,
    DashboardModule,
    OcrModule,
    SyncModule,
    NotificationsModule,
    HealthModule,
    AdminModule,
  ],
  providers: [
    // Auth is enforced globally; routes opt out with @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
