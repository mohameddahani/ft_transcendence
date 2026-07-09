import { Roles } from '@/core/decorators/user-role.decorator';
import { UserType } from '@/generated/prisma/enums';
import { AuthGuard } from '@/core/guards/auth.guard';
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
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import type { JWTPayload } from '@/core/types/jwt-payload.type';

@Controller('/api/payments')
// * Make Authorazation Golbal on this route
@UseGuards(AuthGuard, AuthRolesGuard)
@Roles([UserType.ADMIN, UserType.USER])
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // * Get all Payments
  // ! Check if members is Login
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAll(
    @CurrentUser() userPayload: JWTPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.paymentsService.findAll(
      userPayload.id,
      userPayload.userType,
      page,
      limit,
    );
  }

  // * Get one payment
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(
    @CurrentUser() userPayload: JWTPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentsService.findOne(
      userPayload.id,
      userPayload.userType,
      id,
    );
  }
}
