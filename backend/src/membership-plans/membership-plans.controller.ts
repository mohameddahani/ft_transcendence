import { CurrentUser } from '@/decorators/current-user.decorator';
import { AddMembershipPlanDto } from '@/membership-plans/dtos/add-membership-plan.dto';
import { AuthGuard } from '@/users/guards/auth.guard';
import type { JWTPayload } from '@/utils/types';
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
import { MembershipPlanService } from './membership-plans.service';
import { AddMembershipPlanDurationDto } from './dtos/add-membership-plan-duration.dto';
import { AuthRolesGuard } from '@/users/guards/auth.roles.guard';
import { UserType } from '@/generated/prisma/enums';
import { Roles } from '@/decorators/user-role.decorator';
import { UpdateMembershipPlanDto } from './dtos/update-membership-plan.dto';
import { UpdateMembershipPlanDurationDto } from './dtos/update-membership-plan-duration.dto';

@Controller('/api/membership-plans')
// * Make Authorazation Golbal on this route
@UseGuards(AuthGuard, AuthRolesGuard)
@Roles([UserType.ADMIN])
export class MembershipPlanController {
  constructor(private readonly membershipPlanService: MembershipPlanService) {}

  // * Add Membership plan
  @Post()
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  addMembershipPlan(
    @Body() body: AddMembershipPlanDto,
    @CurrentUser() userPayload: JWTPayload,
  ) {
    return this.membershipPlanService.addMembershipPlan(userPayload.id, body);
  }

  // * Add Membership Duration
  @Post('durations')
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  addMembershipPlanDuration(
    @CurrentUser() userPayload: JWTPayload,
    @Body() body: AddMembershipPlanDurationDto,
  ) {
    return this.membershipPlanService.addMembershipPlanDuration(
      userPayload.id,
      body,
    );
  }

  // * Update Membership Plan
  @Patch(':id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  update(
    @CurrentUser() userPayload: JWTPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMembershipPlanDto,
  ) {
    return this.membershipPlanService.update(userPayload.id, id, body);
  }

  // * Update a Membership Plan Duration
  @Patch('durations/:id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  updateMembershipPlanDuration(
    @CurrentUser() userPayload: JWTPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMembershipPlanDurationDto,
  ) {
    return this.membershipPlanService.updateMembershipPlanDuration(
      userPayload.id,
      id,
      body,
    );
  }

  // * Get all membership Plan
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAll(
    @CurrentUser() userPayload: JWTPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.membershipPlanService.findAll(userPayload.id, page, limit);
  }

  // * Get one membership Plan
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(
    @CurrentUser() userPayload: JWTPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membershipPlanService.findOne(userPayload.id, id);
  }
}
