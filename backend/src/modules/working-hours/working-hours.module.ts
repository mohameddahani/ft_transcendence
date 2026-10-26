import { Module } from '@nestjs/common';
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
  imports: [AccessesModule],
  exports: [],
})
export class WorkingHoursModule {}
