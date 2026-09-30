import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // * Get One Notification (Member)
  async findOneNotificationMember(memberId: string, notificationId: string) {
    const notification = await this.prisma.memberNotification.findFirst({
      where: { id: notificationId, memberId: memberId },
    });

    if (!notification) {
      throw new NotFoundException('Notification Not Found');
    }

    return notification;
  }

  // * Get All Notifications (Member)
  async findAllNotificationsMember(
    memberId: string,
    page: number,
    limit: number,
  ) {
    const notifications = await this.prisma.memberNotification.findMany({
      where: { memberId: memberId },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (notifications.length === 0) {
      throw new NotFoundException('Notifications Not Found');
    }

    return notifications;
  }

  // * Get One Notification (Admin)
  async findOneNotificationAdmin(adminId: string, notificationId: string) {
    const notification = await this.prisma.adminNotification.findFirst({
      where: { id: notificationId, adminId: adminId },
    });

    if (!notification) {
      throw new NotFoundException('Notification Not Found');
    }

    return notification;
  }

  // * Get All Notifications (Admin)
  async findAllNotificationsAdmin(
    adminId: string,
    page: number,
    limit: number,
  ) {
    const notifications = await this.prisma.adminNotification.findMany({
      where: { adminId: adminId },
      skip: (page - 1) * limit,
      take: limit,
    });

    if (notifications.length === 0) {
      throw new NotFoundException('Notifications Not Found');
    }

    return notifications;
  }
}
