import { Roles } from '@/core/decorators/user-role.decorator';
import { NotificationType, Role } from '@/generated/prisma/enums';
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
import { MemberAccessTokenAuthGuard } from '../auth/guards/member-access-token-auth.guard';
import { AuthRolesGuard } from '@/core/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';
import { GetAccessTokenPayload } from '@/core/decorators/get-access-token-payload.decorator';
import type { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { NotificationsService } from './notifications.service';

@Controller('members/notifications')
// * Make Authorazation Golbal on this route
@UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.MEMBER])
export class MemberNotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  // * Get All Stats of Notification (Member)
  @Get('stats')
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  notificationStatsOfMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.notificationService.notificationStatsOfMember(
      accessTokenPayload.id,
    );
  }

  // * Get One Notification
  @Get(':id')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
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
  @Get()
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  findAllNotificationsMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query(
      'notificationType',
      new ParseEnumPipe(NotificationType, { optional: true }),
    )
    notificationType?: NotificationType,
    @Query(
      'isRead',
      new ParseEnumPipe({ TRUE: 'true', FALSE: 'false' }, { optional: true }),
    )
    isRead?: string,
  ) {
    return this.notificationService.findAllNotificationsMember(
      accessTokenPayload.id,
      page,
      limit,
      search,
      notificationType,
      isRead === undefined ? undefined : isRead === 'true',
    );
  }

  // * Make All Notification as Read (Member)
  @Patch()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  makeAllNotificationsReadMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
  ) {
    return this.notificationService.makeAllNotificationsReadMember(
      accessTokenPayload.id,
    );
  }

  // * Make Notification as Read (Member)
  @Patch(':id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  makeNotificationReadMember(
    @GetAccessTokenPayload() accessTokenPayload: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationService.makeNotificationReadMember(
      accessTokenPayload.id,
      id,
    );
  }
}
