import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Role } from '@/generated/prisma/enums';
import { Roles } from '@/core/decorators/user-role.decorator';
import { Throttle } from '@nestjs/throttler';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { type AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { VisitsService } from './visits.service';
import { AdminAccessTokenAuthGuard } from '../auth/guards/admin-access-token-auth.guard';

@Controller('admins/visits')
// * Make Authorazation Golbal on this route
@UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.ADMIN])
export class AdminVisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  // * Get all visits of Today (Admin)
  @Get('today')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  findAll(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.visitsService.findAllVisitsToday(
      accessTokenPayload,
      page,
      limit,
      search,
    );
  }

  // * Get one visit of Today (Admin)
  @Get('today/:id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.visitsService.findOneVisitToday(accessTokenPayload, id);
  }

  // * Get All Stats of Visits (Admin)
  @Get('stats')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  visitStats(@GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload) {
    return this.visitsService.visitStats(accessTokenPayload);
  }
}
