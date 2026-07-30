import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { AdminMembershipsController } from './admin-memberships.controller';
import { AuthModule } from '../auth/auth.module';
import { MemberMembershipsController } from './member-memberships.controller';

@Module({
  controllers: [AdminMembershipsController, MemberMembershipsController],
  providers: [MembershipsService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
})
export class MembershipsModule {}
