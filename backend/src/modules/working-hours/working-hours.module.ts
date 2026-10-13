import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminWorkingHoursController } from './admin-working-hours.controller';
import { WorkingHoursService } from './working-hours.service';
import { StaffWorkingHoursController } from './staff-working-hours.controller';
import { AdminSpecialHoursController } from './admin-special-hours.controller';
import { StaffSpecialHoursController } from './staff-special-hours.controller';
import { MemberWorkingHoursController } from './member-working-hours.controller';
import { MemberSpecialHoursController } from './member-special-hours.controller';
import { AccessesModule } from '@/core/access/access.module';

@Module({
  controllers: [
    AdminWorkingHoursController,
    StaffWorkingHoursController,
    MemberWorkingHoursController,
    AdminSpecialHoursController,
    StaffSpecialHoursController,
    MemberSpecialHoursController,
  ],
  providers: [WorkingHoursService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    AccessesModule,
  ],
  exports: [],
})
export class WorkingHoursModule {}
