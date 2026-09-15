import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminAccessTokenAuthGuard } from '../auth/guards/admin-access-token-auth.guard';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Role } from '@/generated/prisma/enums';
import { Roles } from '@/core/decorators/user-role.decorator';
import { AttendancesService } from './attendances.service';
import { Throttle } from '@nestjs/throttler';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { type AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { AttendanceCheckInDto } from './dtos/attendance-check-in.dto';

@Controller('/api/admins/attendances')
// * Make Authorazation Golbal on this route
@UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.ADMIN])
export class AdminAttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  // * Confirm Attendance By Admin
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
