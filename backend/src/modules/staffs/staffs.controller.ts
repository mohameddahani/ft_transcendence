import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminAccessTokenAuthGuard } from '../auth/guards/admin-access-token-auth.guard';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Roles } from '@/core/decorators/user-role.decorator';
import { Role } from '@/generated/prisma/enums';
import { StaffsService } from './staffs.service';
import { Throttle } from '@nestjs/throttler';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { type AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { AddStaffDto } from './dtos/add-staff.dto';

@Controller('/api/admins/staffs')
// * Make Authorazation Golbal on this route
@UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.ADMIN])
export class StaffsController {
  constructor(private readonly staffsService: StaffsService) {}

  // * Add Staff by Admin
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  addStaff(
    @Body() body: AddStaffDto,
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.staffsService.addStaff(accessTokenPayload.id, body);
  }
}
