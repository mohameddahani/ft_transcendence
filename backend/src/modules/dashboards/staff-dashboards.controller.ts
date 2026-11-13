import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Roles } from '@/core/decorators/user-role.decorator';
import { Role } from '@/generated/prisma/enums';
import { DashboardsService } from './dashboards.service';
import { StaffAccessTokenAuthGuard } from '../auth/guards/staff-access-token-auth.guard';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import type { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { Throttle } from '@nestjs/throttler';

@Controller('staffs/dashboard')
// * Make Authorazation Golbal on this route
@UseGuards(StaffAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.STAFF])
export class StaffDashboardController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  // * Get All Stats of Dashboard (Staff)
  @Get('stats')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  dashboardStats(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.dashboardsService.dashboardStats(accessTokenPayload);
  }
}
