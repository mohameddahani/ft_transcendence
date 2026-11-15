import { Roles } from '@/core/decorators/user-role.decorator';
import { AccountStatus, Role } from '@/generated/prisma/enums';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OwnersService } from './owners.service';
import { OwnerAccessTokenAuthGuard } from '@/modules/auth/guards/owner-access-token-auth.guard';

@Controller('owners')
// * Check if user has valid token and is a owner not normal user
@UseGuards(OwnerAccessTokenAuthGuard, AuthRolesGuard)
// * Set owner roles in this route
@Roles([Role.OWNER])
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  // * Get all users.
  @Get('users')
  findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query(
      'accountStatus',
      new ParseEnumPipe(AccountStatus, { optional: true }),
    )
    accountStatus?: AccountStatus,
    @Query(
      'isAccountVerified',
      new ParseEnumPipe({ TRUE: 'true', FALSE: 'false' }, { optional: true }),
    )
    isAccountVerified?: string,
  ) {
    return this.ownersService.findAll(
      page,
      limit,
      search,
      accountStatus,
      isAccountVerified === undefined
        ? undefined
        : isAccountVerified === 'true',
    );
  }

  // * Get All Stats of users (owner)
  @Get('users/stats')
  userStats() {
    return this.ownersService.userStats();
  }

  // * Get one user
  @Get('users/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ownersService.findOne(id);
  }

  // ! Change Status Account
  // * Active a User
  @Patch('users/active/:id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  ActiveUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.ownersService.ActiveUser(id);
  }

  // * Pending a User
  @Patch('users/pending/:id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  pendingUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.ownersService.pendingUser(id);
  }

  // * Ban a User
  @Patch('users/ban/:id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  banUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.ownersService.banUser(id);
  }
}
