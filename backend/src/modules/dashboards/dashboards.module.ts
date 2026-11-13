import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboards.controller';
import { StaffDashboardController } from './staff-dashboards.controller';
import { DashboardsService } from './dashboards.service';
import { AccessesModule } from '@/core/access/access.module';

@Module({
  controllers: [AdminDashboardController, StaffDashboardController],
  providers: [DashboardsService],
  imports: [AccessesModule],
  exports: [],
})
export class DashboardModule {}
