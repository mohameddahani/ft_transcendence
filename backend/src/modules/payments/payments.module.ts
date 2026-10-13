import { Module } from '@nestjs/common';
import { AdminPaymentsController } from './admin-payments.controller';
import { AuthModule } from '../auth/auth.module';
import { MemberPaymentsController } from './member-payments.controller';
import { PaymentsService } from './payments.service';
import { StaffPaymentsController } from './staff-payments.controller';
import { AccessesModule } from '@/core/access/access.module';

@Module({
  controllers: [
    AdminPaymentsController,
    MemberPaymentsController,
    StaffPaymentsController,
  ],
  providers: [PaymentsService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    AccessesModule,
  ],
  exports: [],
})
export class PaymentsModule {}
