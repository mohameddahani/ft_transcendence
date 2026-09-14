import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { AdminMembershipsController } from './admin-memberships.controller';
import { AuthModule } from '../auth/auth.module';
import { MemberMembershipsController } from './member-memberships.controller';
import { AccessesService } from '@/core/services/access.service';
import { StaffMembershipsController } from './staff-memberships.controller';

@Module({
  controllers: [
    AdminMembershipsController,
    MemberMembershipsController,
    StaffMembershipsController,
  ],
  providers: [MembershipsService, AccessesService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
})
export class MembershipsModule {}
