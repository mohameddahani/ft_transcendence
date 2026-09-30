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
import { MemberAccessTokenAuthGuard } from '../auth/guards/member-access-token-auth.guard';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { SkipThrottle } from '@nestjs/throttler';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import type { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { NotificationsService } from './notifications.service';

@Controller('api/members/notifications')
// * Make Authorazation Golbal on this route
@UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.MEMBER])
export class MemberNotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  // * Get One Notification
  @Get(':id')
  @SkipThrottle() // * Skip Rate Limiting
  findOneNotificationMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationService.findOneNotificationMember(
      accessTokenPayload.id,
      id,
    );
  }

  // * Get All Notifications
  @SkipThrottle() // * Skip Rate Limiting
  findAllNotificationsMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.notificationService.findAllNotificationsMember(
      accessTokenPayload.id,
      page,
      limit,
    );
  }
}
