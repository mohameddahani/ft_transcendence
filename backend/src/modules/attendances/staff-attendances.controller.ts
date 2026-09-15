import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AttendanceCheckInDto } from './dtos/attendance-check-in.dto';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { type AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { AttendancesService } from './attendances.service';
import { StaffAccessTokenAuthGuard } from '../auth/guards/staff-access-token-auth.guard';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Role } from '@/generated/prisma/enums';
import { Roles } from '@/core/decorators/user-role.decorator';

@Controller('/api/staffs/attendances')
// * Make Authorazation Golbal on this route
@UseGuards(StaffAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.STAFF])
export class StaffAttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  // * Confirm Attendance By Staff
  @Post('check-in')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  checkIn(
    @Body() body: AttendanceCheckInDto,
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.attendancesService.checkIn(accessTokenPayload, body);
  }
}
