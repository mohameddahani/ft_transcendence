import {
  Body,
  Controller,
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

@Controller('staffs/working-hours')
// * Make Authorazation Golbal on this route
@UseGuards(StaffAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.STAFF])
export class StaffWorkingHoursController {
  constructor(private readonly workingHoursService: WorkingHoursService) {}

  // * Get All Working Hours (Staff)
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAllWorkingHours(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.workingHoursService.findAllWorkingHours(
      accessTokenPayload,
      page,
      limit,
    );
  }

  // * Get All Stats of Working Hours (Staff)
  @Get('stats')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  workingHourStats(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.workingHoursService.workingHourStats(accessTokenPayload);
  }

  // * Get One Working Hour (Staff)
  @Get(':id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findOneWorkingHour(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workingHoursService.findOneWorkingHour(accessTokenPayload, id);
  }
}
