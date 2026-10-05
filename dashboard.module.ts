import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ObjectivesModule } from '../objectives/objectives.module';
import { WeaponsModule } from '../weapons/weapons.module';
import { CamosModule } from '../camos/camos.module';
import { CallingCardsModule } from '../calling-cards/calling-cards.module';
import { EventsModule } from '../events/events.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [ObjectivesModule, WeaponsModule, CamosModule, CallingCardsModule, EventsModule, AccountsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
