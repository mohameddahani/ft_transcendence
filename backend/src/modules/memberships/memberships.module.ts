import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { AdminMembershipsController } from './admin-memberships.controller';
import { AuthModule } from '../auth/auth.module';
import { MemberMembershipsController } from './member-memberships.controller';
import { SubscriptionsModule } from '../platform/subscriptions/subscriptions.module';

@Module({
  controllers: [AdminMembershipsController, MemberMembershipsController],
  providers: [MembershipsService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    SubscriptionsModule,
  ],
})
export class MembershipsModule {}
