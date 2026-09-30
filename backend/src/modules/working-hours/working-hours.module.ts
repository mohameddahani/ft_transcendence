import { AccessesService } from '@/core/services/access.service';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminWorkingHoursController } from './admin-working-hours.controller';
import { WorkingHoursService } from './working-hours.service';
import { StaffWorkingHoursController } from './staff-working-hours.controller';
import { AdminSpecialHoursController } from './admin-special-hours.controller';
import { StaffSpecialHoursController } from './staff-special-hours.controller';
import { MemberWorkingHoursController } from './member-working-hours.controller';
import { MemberSpecialHoursController } from './member-special-hours.controller';

@Module({
  controllers: [
    AdminWorkingHoursController,
    StaffWorkingHoursController,
    MemberWorkingHoursController,
    AdminSpecialHoursController,
    StaffSpecialHoursController,
    MemberSpecialHoursController,
  ],
  providers: [AccessesService, WorkingHoursService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
  exports: [],
})
export class WorkingHoursModule {}
