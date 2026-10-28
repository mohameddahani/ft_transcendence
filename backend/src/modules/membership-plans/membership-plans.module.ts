import { Module } from '@nestjs/common';
import { AdminMembershipPlansController } from './admin-membership-plans.controller';
import { MembershipPlansService } from './membership-plans.service';
import { StaffMembershipPlansController } from './staff-membership-plans.controller';
import { MemberMembershipPlansController } from './member-membership-plans.controller';
import { AccessesModule } from '@/core/access/access.module';

@Module({
  controllers: [
    AdminMembershipPlansController,
    StaffMembershipPlansController,
    MemberMembershipPlansController,
  ],
  providers: [MembershipPlansService],
  imports: [AccessesModule],
  exports: [],
})
export class MembershipPlansModule {}
