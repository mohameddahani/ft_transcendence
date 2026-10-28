import { Module } from '@nestjs/common';
import { AdminPaymentsController } from './admin-payments.controller';
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
  imports: [AccessesModule],
  exports: [],
})
export class PaymentsModule {}
