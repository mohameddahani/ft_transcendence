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
import { UpdateSpecialHourDto } from './dtos/update-special-hour.dto';
import { AddSpecialHourDto } from './dtos/add-special-hour.dto';

@Controller('/api/admins/special-hours')
// * Make Authorazation Golbal on this route
@UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.ADMIN])
export class AdminSpecialHoursController {
  constructor(private readonly workingHoursService: WorkingHoursService) {}

  // * Add Special Hours By (Admin)
  @Post()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  addSpecialHour(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Body() body: AddSpecialHourDto,
  ) {
    return this.workingHoursService.addSpecialHour(accessTokenPayload.id, body);
  }

  // * Update Special Hours By (Admin)
  @Patch(':id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  updateSpecialHour(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSpecialHourDto,
  ) {
    return this.workingHoursService.updateSpecialHour(
      accessTokenPayload.id,
      id,
      body,
    );
  }

  // * Get All Special Hours (Admin)
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAllSpecialHours(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.workingHoursService.findAllSpecialHours(
      accessTokenPayload,
      page,
      limit,
    );
  }

  // * Get One Special Hour (Admin)
  @Get(':id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findOneSpecialHour(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workingHoursService.findOneSpecialHour(accessTokenPayload, id);
  }

  // * Delete One Special Hour By (Admin)
  @Delete(':id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  deleteOneSpecialHour(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workingHoursService.deleteOneSpecialHour(
      accessTokenPayload.id,
      id,
    );
  }
}
