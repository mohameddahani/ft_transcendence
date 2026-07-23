import { AddMembershipPlanDto } from './dtos/add-membership-plan.dto';
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
import { MembershipPlansService } from './membership-plans.service';
import { AddMembershipPlanDurationDto } from './dtos/add-membership-plan-duration.dto';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { UserType } from '@/generated/prisma/enums';
import { Roles } from '@/core/decorators/user-role.decorator';
import { UpdateMembershipPlanDto } from './dtos/update-membership-plan.dto';
import { UpdateMembershipPlanDurationDto } from './dtos/update-membership-plan-duration.dto';
import { AdminAccessTokenAuthGuard } from '../auth/guards/admin-access-token-auth.guard';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import type { AccessTokenPayload } from '@/core/types/jwt-payload.type';

@Controller('/api/membership-plans')
// * Make Authorazation Golbal on this route
@UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
@Roles([UserType.ADMIN])
export class MembershipPlansController {
  constructor(
    private readonly membershipPlansService: MembershipPlansService,
  ) {}

  // * Add Membership plan
  @Post()
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  addMembershipPlan(
    @Body() body: AddMembershipPlanDto,
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.membershipPlansService.addMembershipPlan(
      accessTokenPayload.id,
      body,
    );
  }

  // * Add Membership Duration
  @Post('durations')
  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  addMembershipPlanDuration(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Body() body: AddMembershipPlanDurationDto,
  ) {
    return this.membershipPlansService.addMembershipPlanDuration(
      accessTokenPayload.id,
      body,
    );
  }

  // * Update Membership Plan
  @Patch(':id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  update(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMembershipPlanDto,
  ) {
    return this.membershipPlansService.update(accessTokenPayload.id, id, body);
  }

  // * Update a Membership Plan Duration
  @Patch('durations/:id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  updateMembershipPlanDuration(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMembershipPlanDurationDto,
  ) {
    return this.membershipPlansService.updateMembershipPlanDuration(
      accessTokenPayload.id,
      id,
      body,
    );
  }

  // * Get all membership Plan
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAll(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.membershipPlansService.findAll(
      accessTokenPayload.id,
      page,
      limit,
    );
  }

  // * Get one membership Plan
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membershipPlansService.findOne(accessTokenPayload.id, id);
  }
}
