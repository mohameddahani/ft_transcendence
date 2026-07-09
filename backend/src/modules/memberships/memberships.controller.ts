import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import type { JWTPayload } from '@/utils/types';
import { AuthGuard } from '@/core/guards/auth.guard';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { UserType } from '@/generated/prisma/enums';
import { Roles } from '@/core/decorators/user-role.decorator';

@Controller('/api/memberships')
// * Make Authorazation Golbal on this route
@UseGuards(AuthGuard, AuthRolesGuard)
@Roles([UserType.ADMIN])
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  // * Get All Memberships
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAll(
    @CurrentUser() userPayload: JWTPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.membershipsService.findAll(userPayload.id, page, limit);
  }

  // * Get One Membership
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(
    @CurrentUser() userPayload: JWTPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membershipsService.findOne(userPayload.id, id);
  }
}
