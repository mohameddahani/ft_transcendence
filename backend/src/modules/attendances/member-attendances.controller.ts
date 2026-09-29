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
import { Throttle } from '@nestjs/throttler';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { type AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { AttendancesService } from './attendances.service';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Role } from '@/generated/prisma/enums';
import { Roles } from '@/core/decorators/user-role.decorator';
import { MemberAccessTokenAuthGuard } from '../auth/guards/member-access-token-auth.guard';

@Controller('/api/members/attendances')
// * Make Authorazation Golbal on this route
@UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.MEMBER])
export class MemberAttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  // * Get All Attendances (Member)
  @Get()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  findAllAttendanceByMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.attendancesService.findAllAttendanceByMember(
      accessTokenPayload.id,
      page,
      limit,
    );
  }

  // * Get One Attendances (Member)
  @Get(':id')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  findOneAttendanceByMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.attendancesService.findOneAttendanceByMember(
      accessTokenPayload.id,
      id,
    );
  }
}
