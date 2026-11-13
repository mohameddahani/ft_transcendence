import { Roles } from '@/core/decorators/user-role.decorator';
import { Role } from '@/generated/prisma/enums';
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
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import type { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { NotificationsService } from './notifications.service';
import { AdminAccessTokenAuthGuard } from '../auth/guards/admin-access-token-auth.guard';

@Controller('admins/notifications')
// * Make Authorazation Golbal on this route
@UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.ADMIN])
export class AdminNotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  // * Get All Stats of Notification (Admin)
  @Get('stats')
  notificationStats(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.notificationService.notificationStats(accessTokenPayload.id);
  }

  // * Get One Notification
  @Get(':id')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  findOneNotificationAdmin(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationService.findOneNotificationAdmin(
      accessTokenPayload.id,
      id,
    );
  }

  // * Get All Notifications
  @Get()
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  findAllNotificationsAdmin(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.notificationService.findAllNotificationsAdmin(
      accessTokenPayload.id,
      page,
      limit,
    );
  }

  // * Make All Notifications as Read (Admin)
  @Patch()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  makeAllNotificationsReadAdmin(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.notificationService.makeAllNotificationsReadAdmin(
      accessTokenPayload.id,
    );
  }

  // * Make Notification as Read (Admin)
  @Patch(':id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  makeNotificationReadAdmin(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationService.makeNotificationReadAdmin(
      accessTokenPayload.id,
      id,
    );
  }
}
