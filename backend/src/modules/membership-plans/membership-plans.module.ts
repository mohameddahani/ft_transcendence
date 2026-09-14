import { Module } from '@nestjs/common';
import { MembershipPlansController } from './membership-plans.controller';
import { MembershipPlansService } from './membership-plans.service';
import { AuthModule } from '../auth/auth.module';
import { AccessesService } from '@/core/services/access.service';

@Module({
  controllers: [MembershipPlansController],
  providers: [MembershipPlansService, AccessesService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
  exports: [],
})
export class MembershipPlansModule {}
