import { CurrentUser } from '@/decorators/current-user.decorator';
import { AddMemeberDto } from '@/members/dtos/add-member.dto';
import { AuthGuard } from '@/users/guards/auth.guard';
import type { JWTPayload } from '@/utils/types';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MembersService } from './members.service';

@Controller('/api/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // * Add Member by User
  @Post()
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  addMember(
    @Body() body: AddMemeberDto,
    @CurrentUser() userPayload: JWTPayload,
  ) {
    return this.membersService.addMember(userPayload.id, body);
  }
}
