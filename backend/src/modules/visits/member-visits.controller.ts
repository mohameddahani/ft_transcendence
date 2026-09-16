import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Role } from '@/generated/prisma/enums';
import { Roles } from '@/core/decorators/user-role.decorator';
import { Throttle } from '@nestjs/throttler';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { type AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { MemberAccessTokenAuthGuard } from '../auth/guards/member-access-token-auth.guard';
import { VisitsService } from './visits.service';

@Controller('/api/members/visits')
// * Make Authorazation Golbal on this route
@UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.MEMBER])
export class MemberVisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  // * Create A Visit
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  createVisit(@GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload) {
    return this.visitsService.createVisit(accessTokenPayload.id);
  }
}
