import { Roles } from '@/decorators/user-role.decorator';
import { UserType } from '@/generated/prisma/enums';
import { AuthGuard } from '@/users/guards/auth.guard';
import { AuthRolesGuard } from '@/users/guards/auth.roles.guard';
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OwnersService } from './owners.service';

@Controller('/api/owners')
// * Check if user has valid token and is a owner not normal user
@UseGuards(AuthGuard, AuthRolesGuard)
// * Set owner roles in this route
@Roles([UserType.OWNER])
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  // * Get all users
  @Get('users')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.ownersService.findAll(page, limit);
  }

  // * Get one user
  @Get('users/:id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ownersService.findOne(id);
  }

  // ! Change Status Account
  // * Active a User
  @Patch('users/active/:id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  ActiveUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.ownersService.ActiveUser(id);
  }

  // * Pending a User
  @Patch('users/pending/:id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  pendingUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.ownersService.pendingUser(id);
  }

  // * Ban a User
  @Patch('users/ban/:id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  banUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.ownersService.banUser(id);
  }
}
