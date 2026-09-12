import { Module } from '@nestjs/common';
import { MembershipPlansController } from './membership-plans.controller';
import { MembershipPlansService } from './membership-plans.service';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../platform/subscriptions/subscriptions.module';

@Module({
  controllers: [MembershipPlansController],
  providers: [MembershipPlansService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    SubscriptionsModule,
  ],
  exports: [],
})
export class MembershipPlansModule {}
