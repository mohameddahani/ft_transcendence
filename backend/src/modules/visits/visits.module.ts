import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MemberVisitsController } from './member-visits.controller';
import { VisitsService } from './visits.service';
import { AdminVisitsController } from './admin-visits.controller';
import { StaffVisitsController } from './staff-visits.controller';
import { AccessesModule } from '@/core/access/access.module';

@Module({
  controllers: [
    MemberVisitsController,
    AdminVisitsController,
    StaffVisitsController,
  ],
  providers: [VisitsService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    AccessesModule,
  ],
  exports: [],
})
export class VisitsModule {}
