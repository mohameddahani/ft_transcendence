import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { Throttle } from '@nestjs/throttler';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { MembershipStatus, Role } from '@/generated/prisma/enums';
import { Roles } from '@/core/decorators/user-role.decorator';
import type { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { StaffAccessTokenAuthGuard } from '../auth/guards/staff-access-token-auth.guard';

@Controller('staffs/memberships')
// * Make Authorazation Golbal on this route
@UseGuards(StaffAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.STAFF])
export class StaffMembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  // * Get All Memberships
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAll(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query(
      'membershipStatus',
      new ParseEnumPipe(MembershipStatus, { optional: true }),
    )
    membershipStatus?: MembershipStatus,
    @Query('membershipPlanId', new ParseUUIDPipe({ optional: true }))
    membershipPlanId?: string,
  ) {
    return this.membershipsService.findAll(
      accessTokenPayload,
      page,
      limit,
      search,
      membershipStatus,
      membershipPlanId,
    );
  }

  // * Get All Stats of Memebership (Staff)
  @Get('stats')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  membershipStats(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.membershipsService.membershipStats(accessTokenPayload);
  }

  // * Get One Membership
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membershipsService.findOne(accessTokenPayload, id);
  }
}
