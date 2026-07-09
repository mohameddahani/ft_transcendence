import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { AddMemberDto } from './dtos/add-member.dto';
import { AuthGuard } from '@/core/guards/auth.guard';
import type { JWTPayload } from '@/core/types/jwt-payload.type';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MembersService } from './members.service';
import { UserType } from '@/generated/prisma/enums';
import { Roles } from '@/core/decorators/user-role.decorator';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { UpdateMemberDto } from './dtos/update-member.dto';

@Controller('/api/members')
// * Make Authorazation Golbal on this route
@UseGuards(AuthGuard, AuthRolesGuard)
@Roles([UserType.ADMIN])
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // * Add Member by User
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  addMember(
    @Body() body: AddMemberDto,
    @CurrentUser() userPayload: JWTPayload,
  ) {
    return this.membersService.addMember(userPayload.id, body);
  }

  // * Update data of Member
  @Patch(':id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  update(
    @CurrentUser() userPayload: JWTPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMemberDto,
  ) {
    return this.membersService.update(userPayload.id, id, body);
  }

  // * Active a Member
  @Patch('active/:id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  activeMember(
    @CurrentUser() userPayload: JWTPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membersService.activeMember(userPayload.id, id);
  }

  // * Freeze a Member
  @Patch('freeze/:id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  freezeMember(
    @CurrentUser() userPayload: JWTPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membersService.freezeMember(userPayload.id, id);
  }

  // * Ban a Member
  @Patch('ban/:id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  banMember(
    @CurrentUser() userPayload: JWTPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membersService.banMember(userPayload.id, id);
  }

  // * Get all Members
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAll(
    @CurrentUser() userPayload: JWTPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.membersService.findAll(userPayload.id, page, limit);
  }

  // * Get one member
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(
    @CurrentUser() userPayload: JWTPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membersService.findOne(userPayload.id, id);
  }
}
