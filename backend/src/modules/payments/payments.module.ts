import { Module } from '@nestjs/common';
import { AdminPaymentsController } from './admin-payments.controller';
import { AuthModule } from '../auth/auth.module';
import { MemberPaymentsController } from './member-payments.controller';
import { PaymentsService } from './payments.service';
import { StaffPaymentsController } from './staff-payments.controller';
import { AccessesService } from '@/core/services/access.service';

@Module({
  controllers: [
    AdminPaymentsController,
    MemberPaymentsController,
    StaffPaymentsController,
  ],
  providers: [PaymentsService, AccessesService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
  exports: [],
})
export class PaymentsModule {}
