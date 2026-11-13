import { Module } from '@nestjs/common';
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
  imports: [AccessesModule],
  exports: [],
})
export class VisitsModule {}
