import { Roles } from '@/decorators/user-role.decorator';
import { UserType } from '@/generated/prisma/enums';
import { AddPlanDto } from '@/plans/dtos/add-plan.dto';
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
import { PlansService } from './plans.service';
import { AddPlanDurationDto } from './dtos/add-plan-duration.dto';

@Controller('/api/plans')
// * Make Authorazation Golbal on this route
@UseGuards(AuthGuard, AuthRolesGuard)
@Roles([UserType.OWNER])
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  // * Add Plan
  @Post()
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  addPlan(@Body() body: AddPlanDto) {
    return this.plansService.addPlan(body);
  }

  // * Add Plan Duration
  @Post('durations')
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  addPlanDuration(@Body() body: AddPlanDurationDto) {
    return this.plansService.addPlanDuration(body);
  }

  // * Get all Plan
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.plansService.findAll(page, limit);
  }

  // * Get one Plan
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.plansService.findOne(id);
  }
}
