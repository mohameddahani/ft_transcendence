import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Role } from '@/generated/prisma/enums';
import { Roles } from '@/core/decorators/user-role.decorator';
import type { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { MemberAccessTokenAuthGuard } from '../auth/guards/member-access-token-auth.guard';

@Controller('/api/members/memberships')
// * Make Authorazation Golbal on this route
@UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.MEMBER])
export class MemberMembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  // * Get Membership of Member
  @Get('me')
  @SkipThrottle() // * Skip Rate Limiting
  findMyMembership(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.membershipsService.findMyMembership(accessTokenPayload.id);
  }

  // * Get All Membership of Member
  @Get('all')
  @SkipThrottle() // * Skip Rate Limiting
  findAllMemberships(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.membershipsService.findAllMemberships(
      accessTokenPayload.id,
      page,
      limit,
    );
  }
}
