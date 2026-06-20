import { Roles } from '@/decorators/user-role.decorator';
import { UserType } from '@/generated/prisma/enums';
import { AddPlanDto } from '@/plans/dtos/add-plan.dto';
import { AuthGuard } from '@/users/guards/auth.guard';
import { AuthRolesGuard } from '@/users/guards/auth.roles.guard';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PlansService } from './plans.service';
import { AddPlanDurationDto } from './dtos/add-plan-duration.dto';

@Controller('/api/plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  // * Add Plan
  @Post()
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles([UserType.OWNER])
  @Throttle({ default: { limit: 3, ttl: 600_000 } })
  addPlan(@Body() body: AddPlanDto) {
    return this.plansService.addPlan(body);
  }

  // * Add Plan Duration
  @Post('durations')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles([UserType.OWNER])
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  addPlanDuration(@Body() body: AddPlanDurationDto) {
    return this.plansService.addPlanDuration(body);
  }
}
