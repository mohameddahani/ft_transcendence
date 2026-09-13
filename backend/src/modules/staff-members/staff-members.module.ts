import { Module } from '@nestjs/common';
import { StaffMembersController } from './staff-members.controller';
import { AuthModule } from '../auth/auth.module';
import { MembersModule } from '../members/members.module';

@Module({
  controllers: [StaffMembersController],
  providers: [],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    MembersModule,
  ],
  exports: [],
})
export class StaffMembersModule {}
