import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminAccessTokenAuthGuard } from '../auth/guards/admin-access-token-auth.guard';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Roles } from '@/core/decorators/user-role.decorator';
import { Role } from '@/generated/prisma/enums';
import { StaffsService } from './staffs.service';
import { Throttle } from '@nestjs/throttler';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { type AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { AddStaffDto } from './dtos/add-staff.dto';

@Controller('/api/admins/staffs')
// * Make Authorazation Golbal on this route
@UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.ADMIN])
export class StaffsController {
  constructor(private readonly staffsService: StaffsService) {}

  // * Add Staff by Admin
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  addStaff(
    @Body() body: AddStaffDto,
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.staffsService.addStaff(accessTokenPayload.id, body);
  }

  // * Get All Staffs
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAll(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.staffsService.findAll(accessTokenPayload.id, page, limit);
  }

  // * Get one member
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.staffsService.findOne(accessTokenPayload.id, id);
  }
}
