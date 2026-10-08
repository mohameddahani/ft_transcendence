import { Module } from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { StaffAttendancesController } from './staff-attendances.controller';
import { AdminAttendancesController } from './admin-attendances.controller';
import { AuthModule } from '../auth/auth.module';
import { MemberAttendancesController } from './member-attendances.controller';
import { AccessesModule } from '@/core/access/access.module';

@Module({
  controllers: [
    AdminAttendancesController,
    StaffAttendancesController,
    MemberAttendancesController,
  ],
  providers: [AttendancesService],
  imports: [
    AuthModule, // * Imported to register the Passport strategies defined in the AuthModule, which are used by this module.
    AccessesModule,
  ],
  exports: [],
})
export class AttendancesModule {}
