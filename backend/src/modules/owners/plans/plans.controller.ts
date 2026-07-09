import { Roles } from '@/core/decorators/user-role.decorator';
import { UserType } from '@/generated/prisma/enums';
import { AddPlanDto } from './dtos/add-plan.dto';
import { AuthGuard } from '@/core/guards/auth.guard';
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
import { PlansService } from './plans.service';
import { AddPlanDurationDto } from './dtos/add-plan-duration.dto';
import { UpdatePlanDto } from './dtos/update-plan.dto';
import { UpdatePlanDurationDto } from './dtos/update-plan-duration.dto';

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

  // * Update a Plan
  @Patch(':id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdatePlanDto) {
    return this.plansService.update(id, body);
  }

  // * Update a Plan Duration
  @Patch('durations/:id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  updatePlanDuration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdatePlanDurationDto,
  ) {
    return this.plansService.updatePlanDuration(id, body);
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
