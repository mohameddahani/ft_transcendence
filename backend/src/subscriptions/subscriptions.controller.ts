import { Roles } from '@/decorators/user-role.decorator';
import { UserType } from '@/generated/prisma/enums';
import { AuthGuard } from '@/users/guards/auth.guard';
import { AuthRolesGuard } from '@/users/guards/auth.roles.guard';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ActiveSubscriptionDto } from './dtos/active-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('/api/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // * Active Subscription
  @Post()
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles([UserType.OWNER])
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  activeSubscription(@Body() body: ActiveSubscriptionDto) {
    return this.subscriptionsService.activeSubscription(body);
  }
}
