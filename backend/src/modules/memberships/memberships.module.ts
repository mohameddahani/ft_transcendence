import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { AdminMembershipsController } from './admin-memberships.controller';
import { AuthModule } from '../auth/auth.module';
import { MemberMembershipsController } from './member-memberships.controller';
import { StaffMembershipsController } from './staff-memberships.controller';
import { AccessesModule } from '@/core/access/access.module';

@Module({
  controllers: [
    AdminMembershipsController,
    MemberMembershipsController,
    StaffMembershipsController,
  ],
  providers: [MembershipsService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    AccessesModule,
  ],
})
export class MembershipsModule {}
