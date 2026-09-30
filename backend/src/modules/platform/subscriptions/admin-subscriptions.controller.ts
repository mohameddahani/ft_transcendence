import { Roles } from '@/core/decorators/user-role.decorator';
import { Role } from '@/generated/prisma/enums';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { SubscriptionsService } from './subscriptions.service';
import { AdminAccessTokenAuthGuard } from '@/modules/auth/guards/admin-access-token-auth.guard';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import type { AccessTokenPayload } from '@/core/types/jwt-payload.type';

@Controller('/api/admins/subscriptions')
// * Make Authorazation Golbal on this route
@UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.ADMIN])
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // * Get Subscription of Admin
  @Get('me')
  @SkipThrottle() // * Skip Rate Limiting
  findMySubscription(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.subscriptionsService.findMySubscription(accessTokenPayload.id);
  }

  // * Get All Subscriptions of Admin
  @Get('all')
  @SkipThrottle() // * Skip Rate Limiting
  findAllSubscriptions(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.subscriptionsService.findAllSubscriptions(
      accessTokenPayload.id,
      page,
      limit,
    );
  }
}
