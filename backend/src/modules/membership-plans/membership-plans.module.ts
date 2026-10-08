import { Module } from '@nestjs/common';
import { AdminMembershipPlansController } from './admin-membership-plans.controller';
import { MembershipPlansService } from './membership-plans.service';
import { AuthModule } from '../auth/auth.module';
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
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    AccessesModule,
  ],
  exports: [],
})
export class MembershipPlansModule {}
