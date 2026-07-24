import { AddMemberDto } from './dtos/add-member.dto';
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
import { AdminAccessTokenAuthGuard } from '../auth/guards/admin-access-token-auth.guard';
import type { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';

@Controller('/api/members')
// * Make Authorazation Golbal on this route
@UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
@Roles([UserType.ADMIN])
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // * Add Member by User
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  addMember(
    @Body() body: AddMemberDto,
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.membersService.addMember(accessTokenPayload.id, body);
  }

  // * Update data of Member
  @Patch(':id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  update(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMemberDto,
  ) {
    return this.membersService.update(accessTokenPayload.id, id, body);
  }

  // * Active a Member
  @Patch('active/:id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  activeMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membersService.activeMember(accessTokenPayload.id, id);
  }

  // * Freeze a Member
  @Patch('freeze/:id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  freezeMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membersService.freezeMember(accessTokenPayload.id, id);
  }

  // * Ban a Member
  @Patch('ban/:id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } }) // * Set Rate Limiting (20 req / 1 min)
  banMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membersService.banMember(accessTokenPayload.id, id);
  }

  // * Get all Members
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAll(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.membersService.findAll(accessTokenPayload.id, page, limit);
  }

  // * Get one member
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.membersService.findOne(accessTokenPayload.id, id);
  }
}
