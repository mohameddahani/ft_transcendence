import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Roles } from '@/core/decorators/user-role.decorator';
import { Role } from '@/generated/prisma/enums';
import { Throttle } from '@nestjs/throttler';
import { type AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { WorkingHoursService } from './working-hours.service';
import { StaffAccessTokenAuthGuard } from '../auth/guards/staff-access-token-auth.guard';

@Controller('/api/staffs/special-hours')
// * Make Authorazation Golbal on this route
@UseGuards(StaffAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.STAFF])
export class StaffSpecialHoursController {
  constructor(private readonly workingHoursService: WorkingHoursService) {}

  // * Get All Special Hours (Staff)
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAllSpecialHours(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.workingHoursService.findAllSpecialHours(
      accessTokenPayload,
      page,
      limit,
    );
  }

  // * Get One Special Hour (Staff)
  @Get(':id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findOneSpecialHour(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workingHoursService.findOneSpecialHour(accessTokenPayload, id);
  }

  // * Delete One Special Hour By (Staff)
  @Delete(':id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  deleteOneSpecialHour(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workingHoursService.deleteOneSpecialHour(
      accessTokenPayload.id,
      id,
    );
  }
}
