import { Module } from '@nestjs/common';
import { AdminPaymentsController } from './admin-payments.controller';
import { AuthModule } from '../auth/auth.module';
import { MemberPaymentsController } from './member-payments.controller';
import { PaymentsService } from './payments.service';
import { SubscriptionsModule } from '../platform/subscriptions/subscriptions.module';

@Module({
  controllers: [AdminPaymentsController, MemberPaymentsController],
  providers: [PaymentsService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    SubscriptionsModule,
  ],
  exports: [],
})
export class PaymentsModule {}
