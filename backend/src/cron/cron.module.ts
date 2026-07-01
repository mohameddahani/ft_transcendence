import { Module } from '@nestjs/common';
import { SubscriptionCron } from './subscription.cron';
import { MembershipCron } from './membership.cron';
import { PaymentCron } from './payment.cron';

@Module({
  controllers: [],
  providers: [SubscriptionCron, MembershipCron, PaymentCron],
  imports: [],
  exports: [],
})
export class CronModule {}
