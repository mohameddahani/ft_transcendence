import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { AdminMembershipsController } from './admin-memberships.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [AdminMembershipsController],
  providers: [MembershipsService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
})
export class MembershipsModule {}
