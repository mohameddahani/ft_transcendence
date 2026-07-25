import { Module } from '@nestjs/common';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminPaymentsService } from './admin-payments.service';
import { AuthModule } from '../auth/auth.module';
import { MemberPaymentsController } from './member-payments.controller';
import { MemberPaymentsService } from './member-payments.service';

@Module({
  controllers: [AdminPaymentsController, MemberPaymentsController],
  providers: [AdminPaymentsService, MemberPaymentsService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
  exports: [],
})
export class PaymentsModule {}
