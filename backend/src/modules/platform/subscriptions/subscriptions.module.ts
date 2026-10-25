import { Module } from '@nestjs/common';
import { OwnerSubscriptionsController } from './owner-subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { AuthModule } from '@/modules/auth/auth.module';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { AccessesModule } from '@/core/access/access.module';

@Module({
  controllers: [OwnerSubscriptionsController, AdminSubscriptionsController],
  providers: [SubscriptionsService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    AccessesModule,
  ],
  exports: [],
})
export class SubscriptionsModule {}
