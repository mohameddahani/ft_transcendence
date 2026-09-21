import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminAccessTokenAuthGuard } from '../auth/guards/admin-access-token-auth.guard';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Roles } from '@/core/decorators/user-role.decorator';
import { Role } from '@/generated/prisma/enums';
import { Throttle } from '@nestjs/throttler';
import { type AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { WorkingHoursService } from './working-hours.service';
import { AddWorkingHourDto } from './dtos/add-working-hour.dto';

@Controller('/api/admins/working-hours')
// * Make Authorazation Golbal on this route
@UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.ADMIN])
export class AdminWorkingHoursController {
  constructor(private readonly workingHoursService: WorkingHoursService) {}

  // * Add Working Hours By (Admin)
  @Post()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  addWorkingHourByDay(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Body() body: AddWorkingHourDto,
  ) {
    return this.workingHoursService.addWorkingHourByDay(
      accessTokenPayload.id,
      body,
    );
  }

  // * Update Working Hours By (Admin)
  @Patch(':id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  updateWorkingHourByDay(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AddWorkingHourDto,
  ) {
    return this.workingHoursService.updateWorkingHourByDay(
      accessTokenPayload.id,
      id,
      body,
    );
  }

  // * Get All Working Hours (Admin)
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAllWoringHours(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.workingHoursService.findAll(accessTokenPayload, page, limit);
  }

  // * Get One Working Hour (Admin)
  @Get(':id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findOneWoringHour(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workingHoursService.findOne(accessTokenPayload, id);
  }

  // * Delete One Working Hour By (Admin)
  @Delete(':id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  deleteOneWorkingHour(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workingHoursService.delete(accessTokenPayload.id, id);
  }
}
