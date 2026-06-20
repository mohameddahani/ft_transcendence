import { CurrentUser } from '@/decorators/current-user.decorator';
import { AddMemebershipPlanDto } from '@/membership-plans/dtos/add-membership-plan.dto';
import { AuthGuard } from '@/users/guards/auth.guard';
import type { JWTPayload } from '@/utils/types';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MembershipPlanService } from './membership-plans.service';

@Controller('/api/membership-plans')
export class MembershipPlanController {
  constructor(private readonly membershipPlanService: MembershipPlanService) {}

  // * Add Membership plan
  @Post()
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  addMembershipPlan(
    @Body() body: AddMemebershipPlanDto,
    @CurrentUser() userPayload: JWTPayload,
  ) {
    return this.membershipPlanService.addMembershipPlan(userPayload.id, body);
  }
}
