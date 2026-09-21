import { Roles } from '@/core/decorators/user-role.decorator';
import { Role } from '@/generated/prisma/enums';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Throttle } from '@nestjs/throttler';
import type { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { StaffAccessTokenAuthGuard } from '../auth/guards/staff-access-token-auth.guard';

@Controller('/api/staffs/payments')
// * Make Authorazation Golbal on this route
@UseGuards(StaffAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.STAFF])
export class StaffPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // * Get all Payments (Staff)
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAll(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.paymentsService.findAllPayments(
      accessTokenPayload,
      page,
      limit,
    );
  }

  // * Get one payment (Staff)
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentsService.findOnePayment(accessTokenPayload, id);
  }
}
