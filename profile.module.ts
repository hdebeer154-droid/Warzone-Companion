import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { MatchesModule } from '../matches/matches.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [MatchesModule, AccountsModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
