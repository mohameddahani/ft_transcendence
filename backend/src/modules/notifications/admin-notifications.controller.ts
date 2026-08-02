import { Roles } from '@/core/decorators/user-role.decorator';
import { Role } from '@/generated/prisma/enums';
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { SkipThrottle } from '@nestjs/throttler';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import type { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { NotificationsService } from './notifications.service';
import { AdminAccessTokenAuthGuard } from '../auth/guards/admin-access-token-auth.guard';

@Controller('api/admins/notifications')
// * Make Authorazation Golbal on this route
@UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.ADMIN])
export class AdminNotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  // * Get One Notification
  @Get(':id')
  @SkipThrottle() // * Skip Rate Limiting
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
  @SkipThrottle() // * Skip Rate Limiting
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
}
