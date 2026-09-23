import {
  Get,
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Role } from '@/generated/prisma/enums';
import { Roles } from '@/core/decorators/user-role.decorator';
import { Throttle } from '@nestjs/throttler';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { type AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { MemberAccessTokenAuthGuard } from '../auth/guards/member-access-token-auth.guard';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dtos/create-visit.dto';

@Controller('/api/members/visits')
// * Make Authorazation Golbal on this route
@UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.MEMBER])
export class MemberVisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  // * Create A Visit
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  createVisit(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Body() body: CreateVisitDto,
  ) {
    return this.visitsService.createVisit(accessTokenPayload.id, body);
  }

  // * Cancel A Visit
  @Patch('cancel/:id')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  cancelVisit(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.visitsService.cancelVisit(accessTokenPayload.id, id);
  }

  // * Get all Upcoming visits of Today (Member)
  @Get('upcoming')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAllUpcoming(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.visitsService.findAllUpcomingVisitsByMember(
      accessTokenPayload.id,
      page,
      limit,
    );
  }

  // * Get all visits of Today (Member)
  @Get('today')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAll(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.visitsService.findAllVisitsTodayByMember(
      accessTokenPayload.id,
      page,
      limit,
    );
  }

  // * Get one visit of Today (Member)
  @Get('today/:id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.visitsService.findOneVisitTodayByMember(
      accessTokenPayload.id,
      id,
    );
  }
}
