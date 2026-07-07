import { Roles } from '@/decorators/user-role.decorator';
import { UserType } from '@/generated/prisma/enums';
import { AuthGuard } from '@/users/guards/auth.guard';
import { AuthRolesGuard } from '@/users/guards/auth.roles.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ActiveSubscriptionDto } from './dtos/active-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('/api/subscriptions')
// * Make Authorazation Golbal on this route
@UseGuards(AuthGuard, AuthRolesGuard)
@Roles([UserType.OWNER])
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // * Active Subscription
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  activeSubscription(@Body() body: ActiveSubscriptionDto) {
    return this.subscriptionsService.activeSubscription(body);
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
