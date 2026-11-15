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
import { AdminAccessTokenAuthGuard } from '../auth/guards/admin-access-token-auth.guard';

@Controller('admins/payments')
// * Make Authorazation Golbal on this route
@UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.ADMIN])
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // * Get all Payments (Admin)
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

  // * Get All Stats of Payments (Admin)
  @Get('stats')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  paymentStatsOfAdmin(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.paymentsService.paymentStatsOfAdmin(accessTokenPayload);
  }

  // * Get one payment (Admin)
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentsService.findOnePayment(accessTokenPayload, id);
  }
}
