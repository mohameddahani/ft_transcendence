import { Module } from '@nestjs/common';
import { SubscriptionCron } from './subscription.cron';
import { MembershipPlanCron } from './membership-plan.cron';
import { PaymentCron } from './payment.cron';

@Module({
  controllers: [],
  providers: [SubscriptionCron, MembershipPlanCron, PaymentCron],
  imports: [],
  exports: [],
})
export class CronModule {}
