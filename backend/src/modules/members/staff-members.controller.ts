import { Role } from '@/generated/prisma/enums';
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
import { StaffAccessTokenAuthGuard } from '../auth/guards/staff-access-token-auth.guard';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Roles } from '@/core/decorators/user-role.decorator';
import { Throttle } from '@nestjs/throttler';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import { AddMemberDto } from '../members/dtos/add-member.dto';
import { type AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { UpdateMemberDto } from '../members/dtos/update-member.dto';
import { MembersService } from '../members/members.service';

@Controller('/api/staffs/members')
// * Make Authorazation Golbal on this route
@UseGuards(StaffAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.STAFF])
export class StaffMembersController {
  constructor(private readonly membersService: MembersService) {}

  // * Add Member by Staff
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  addMemberByStaff(
    @Body() body: AddMemberDto,
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.membersService.addMember(accessTokenPayload, body);
  }

  // * Update data of Member
  @Patch(':id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  update(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMemberDto,
  ) {
    return this.membersService.update(accessTokenPayload, id, body);
  }

  // * Active a Member
  @Patch('active/:id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  activeMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membersService.activeMember(accessTokenPayload, id);
  }

  // * Freeze a Member
  @Patch('freeze/:id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  freezeMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membersService.freezeMember(accessTokenPayload, id);
  }

  // * Ban a Member
  @Patch('ban/:id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  banMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membersService.banMember(accessTokenPayload, id);
  }

  // * Get all Members
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAll(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.membersService.findAll(accessTokenPayload, page, limit);
  }

  // * Get one member
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membersService.findOne(accessTokenPayload, id);
  }
}
