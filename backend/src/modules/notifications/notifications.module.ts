import { Module } from '@nestjs/common';
import { MemberNotificationsController } from './member-notifications.controller';
import { NotificationsService } from './notifications.service';
import { AdminNotificationsController } from './admin-notifications.controller';

@Module({
  controllers: [MemberNotificationsController, AdminNotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
