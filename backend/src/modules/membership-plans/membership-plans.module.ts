import { Module } from '@nestjs/common';
import { AdminMembershipPlansController } from './admin-membership-plans.controller';
import { MembershipPlansService } from './membership-plans.service';
import { AuthModule } from '../auth/auth.module';
import { AccessesService } from '@/core/services/access.service';
import { StaffMembershipPlansController } from './staff-membership-plans.controller';

@Module({
  controllers: [AdminMembershipPlansController, StaffMembershipPlansController],
  providers: [MembershipPlansService, AccessesService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
  exports: [],
})
export class MembershipPlansModule {}
