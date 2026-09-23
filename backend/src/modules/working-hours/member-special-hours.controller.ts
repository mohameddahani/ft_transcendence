import {
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
import { MemberAccessTokenAuthGuard } from '../auth/guards/member-access-token-auth.guard';

@Controller('/api/members/special-hours')
// * Make Authorazation Golbal on this route
@UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.MEMBER])
export class MemberSpecialHoursController {
  constructor(private readonly workingHoursService: WorkingHoursService) {}

  // * Get All Special Hours (Member)
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAllSpecialHours(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.workingHoursService.findAllSpecialHoursByMember(
      accessTokenPayload.id,
      page,
      limit,
    );
  }

  // * Get One Special Hour (Member)
  @Get(':id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findOneSpecialHour(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workingHoursService.findOneSpecialHourByMember(
      accessTokenPayload.id,
      id,
    );
  }
}
