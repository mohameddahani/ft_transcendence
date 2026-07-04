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
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.ownersService.findAll(page, limit);
  }

  // * Get one user
  @Get(':id')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ownersService.findOne(id);
  }
}
