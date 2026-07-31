import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { Roles } from '@/core/decorators/user-role.decorator';
import type { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { Role } from '@/generated/prisma/enums';
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MemberPaymentsService } from './member-payments.service';
import { MemberAccessTokenAuthGuard } from '../auth/guards/member-access-token-auth.guard';
import { AuthRolesGuard } from '@/core/guards/roles.guard';

@Controller('/api/members/payments')
// * Make Authorazation Golbal on this route
@UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.MEMBER])
export class MemberPaymentsController {
  constructor(private readonly memberPaymentsService: MemberPaymentsService) {}

  // * Get all Payments (Member)
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAll(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.memberPaymentsService.findAll(
      accessTokenPayload.id,
      page,
      limit,
    );
  }

  // * Get one payment (Member)
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.memberPaymentsService.findOne(accessTokenPayload.id, id);
  }
}
