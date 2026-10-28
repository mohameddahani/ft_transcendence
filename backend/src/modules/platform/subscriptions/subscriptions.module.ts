import { Module } from '@nestjs/common';
import { OwnerSubscriptionsController } from './owner-subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { AccessesModule } from '@/core/access/access.module';

@Module({
  controllers: [OwnerSubscriptionsController, AdminSubscriptionsController],
  providers: [SubscriptionsService],
  imports: [AccessesModule],
  exports: [],
})
export class SubscriptionsModule {}
