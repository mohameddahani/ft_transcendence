import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAccessTokenAuthGuard } from '../auth/guards/admin-access-token-auth.guard';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Roles } from '@/core/decorators/user-role.decorator';
import { Role } from '@/generated/prisma/enums';
import { DashboardsService } from './dashboards.service';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import type { AccessTokenPayload } from '@/core/types/jwt-payload.type';

@Controller('admins/dashboard')
// * Make Authorazation Golbal on this route
@UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.ADMIN])
export class AdminDashboardController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  // * Get All Stats of Dashboard (Admin)
  @Get('stats')
  dashboardStats(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.dashboardsService.dashboardStats(accessTokenPayload);
  }
}
