import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { type AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { AttendancesService } from './attendances.service';
import { StaffAccessTokenAuthGuard } from '../auth/guards/staff-access-token-auth.guard';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Role } from '@/generated/prisma/enums';
import { Roles } from '@/core/decorators/user-role.decorator';
import { AttendanceManualCheckInDto } from './dtos/attendance-manual-check-in.dto';
import { AttendanceQrCheckInDto } from './dtos/attendance-qr-check-in.dto';

@Controller('/api/staffs/attendances')
// * Make Authorazation Golbal on this route
@UseGuards(StaffAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.STAFF])
export class StaffAttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  // * Check in a member manually
  @Post('check-in/manual')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  checkInManually(
    @Body() body: AttendanceManualCheckInDto,
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.attendancesService.checkInManually(accessTokenPayload, body);
  }

  // * Check in a member using QR code
  @Post('check-in/qr')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  checkInWithQr(
    @Body() body: AttendanceQrCheckInDto,
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.attendancesService.checkInWithQr(accessTokenPayload, body);
  }
}
