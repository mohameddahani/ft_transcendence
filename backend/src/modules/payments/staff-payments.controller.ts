import { Roles } from '@/core/decorators/user-role.decorator';
import { Role } from '@/generated/prisma/enums';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import {
  Controller,
  Get,
  Param,
  ParseDatePipe,
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

@Controller('staffs/payments')
// * Make Authorazation Golbal on this route
@UseGuards(StaffAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.STAFF])
export class StaffPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // * Get all Payments (Staff)
  @Get()
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  findAll(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('from', new ParseDatePipe({ optional: true }))
    from?: Date,
    @Query('to', new ParseDatePipe({ optional: true }))
    to?: Date,
  ) {
    return this.paymentsService.findAllPayments(
      accessTokenPayload,
      page,
      limit,
      search,
      from,
      to,
    );
  }

  // * Get All Stats of payments (Staff)
  @Get('stats')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  paymentStatsOfStaff(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.paymentsService.paymentStatsOfStaff(accessTokenPayload);
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
