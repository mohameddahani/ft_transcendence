import { Roles } from '@/core/decorators/user-role.decorator';
import { UserType } from '@/generated/prisma/enums';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ActiveSubscriptionDto } from './dtos/active-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';
import { CancelSubscriptionDto } from './dtos/cancel-subscription.dto';
import { OwnerAccessTokenAuthGuard } from '@/modules/auth/guards/owner-access-token-auth.guard';

@Controller('/api/subscriptions')
// * Make Authorazation Golbal on this route
@UseGuards(OwnerAccessTokenAuthGuard, AuthRolesGuard)
@Roles([UserType.OWNER])
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // * Active Subscription
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  activeSubscription(@Body() body: ActiveSubscriptionDto) {
    return this.subscriptionsService.activeSubscription(body);
  }

  // * Cancel Subscription
  @Patch()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  cancelSubscription(@Body() body: CancelSubscriptionDto) {
    return this.subscriptionsService.cancelSubscription(body.userId);
  }

  // * Get all Subscriptions
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.subscriptionsService.findAll(page, limit);
  }

  // * Get one Subscriptions
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionsService.findOne(id);
  }
}
