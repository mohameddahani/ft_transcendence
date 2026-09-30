import { Module } from '@nestjs/common';
import { OwnerSubscriptionsController } from './owner-subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { AuthModule } from '@/modules/auth/auth.module';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { AccessesService } from '@/core/services/access.service';

@Module({
  controllers: [OwnerSubscriptionsController, AdminSubscriptionsController],
  providers: [SubscriptionsService, AccessesService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
  exports: [],
})
export class SubscriptionsModule {}
