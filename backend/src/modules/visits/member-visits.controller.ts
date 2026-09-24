import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
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
  @Patch(':id/cancel')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  cancelVisit(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.visitsService.cancelVisit(accessTokenPayload.id, id);
  }
}
