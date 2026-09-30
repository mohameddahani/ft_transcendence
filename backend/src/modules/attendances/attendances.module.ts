import { Module } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { StaffAttendancesController } from './staff-attendances.controller';
import { AdminAttendancesController } from './admin-attendances.controller';
import { AuthModule } from '../auth/auth.module';
import { AccessesService } from '@/core/services/access.service';
import { MemberAttendancesController } from './member-attendances.controller';

@Module({
  controllers: [
    AdminAttendancesController,
    StaffAttendancesController,
    MemberAttendancesController,
  ],
  providers: [AttendancesService, AccessesService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
  ],
  exports: [],
})
export class AttendancesModule {}
