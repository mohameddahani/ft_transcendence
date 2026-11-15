import {
  Controller,
  Get,
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
import { MemberAccessTokenAuthGuard } from '../auth/guards/member-access-token-auth.guard';

@Controller('members/memberships')
// * Make Authorazation Golbal on this route
@UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.MEMBER])
export class MemberMembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  // * Get Membership of Member
  @Get('me')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  findMyMembership(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.membershipsService.findMyMembership(accessTokenPayload.id);
  }

  // * Get All Membership of Member
  @Get('all')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  findAllMemberships(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query(
      'membershipStatus',
      new ParseEnumPipe(MembershipStatus, { optional: true }),
    )
    membershipStatus?: MembershipStatus,
    @Query('membershipPlanId', new ParseUUIDPipe({ optional: true }))
    membershipPlanId?: string,
  ) {
    return this.membershipsService.findAllMemberships(
      accessTokenPayload.id,
      page,
      limit,
      membershipStatus,
      membershipPlanId,
    );
  }

  // * Get All Stats of Memebership (Member)
  @Get('stats')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  membershipStatsOfMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.membershipsService.membershipStatsOfMember(
      accessTokenPayload.id,
    );
  }
}
