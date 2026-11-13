import { Module } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { StaffAttendancesController } from './staff-attendances.controller';
import { AdminAttendancesController } from './admin-attendances.controller';
import { MemberAttendancesController } from './member-attendances.controller';
import { AccessesModule } from '@/core/access/access.module';

@Module({
  controllers: [
    AdminAttendancesController,
    StaffAttendancesController,
    MemberAttendancesController,
  ],
  providers: [AttendancesService],
  imports: [AccessesModule],
  exports: [],
})
export class AttendancesModule {}
