import { Module } from '@nestjs/common';
import { SubscriptionCron } from './subscription.cron';

@Module({
  controllers: [],
  providers: [SubscriptionCron],
  imports: [],
  exports: [],
})
export class CronModule {}
