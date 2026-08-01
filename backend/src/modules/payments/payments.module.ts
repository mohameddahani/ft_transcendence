import { Module } from '@nestjs/common';
import { AdminPaymentsController } from './admin-payments.controller';
import { AuthModule } from '../auth/auth.module';
import { MemberPaymentsController } from './member-payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [AdminPaymentsController, MemberPaymentsController],
  providers: [PaymentsService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
  exports: [],
})
export class PaymentsModule {}
