import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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

  // * Make All Notification as Read (Admin)
  async makeAllNotificationsReadAdmin(adminId: string) {
    // * check if his as any notification non read
    const notifications = await this.prisma.adminNotification.findMany({
      where: {
        adminId: adminId,
        isRead: false,
      },
    });

    // * Check it if already mark as read
    if (notifications.length === 0) {
      throw new ConflictException('All Notifications Already Mark As Read');
    }

    await this.prisma.adminNotification.updateMany({
      where: {
        adminId: adminId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  // * Make Notification as Read (Admin)
  async makeNotificationReadAdmin(adminId: string, notificationId: string) {
    // * check if notification is exist
    const notification = await this.findOneNotificationAdmin(
      adminId,
      notificationId,
    );

    // * Check it if already mark as read
    if (notification.isRead) {
      throw new ConflictException('The Notification Already Mark As Read');
    }

    return await this.prisma.adminNotification.update({
      where: {
        id: notification.id,
      },
      data: {
        isRead: true,
      },
    });
  }

  // * Make Notification as Read (Member)
  async makeAllNotificationsReadMember(memberId: string) {
    // * check if his as any notification non read
    const notifications = await this.prisma.memberNotification.findMany({
      where: {
        memberId: memberId,
        isRead: false,
      },
    });

    // * Check it if already mark as read
    if (notifications.length === 0) {
      throw new ConflictException('All Notifications Already Mark As Read');
    }

    await this.prisma.memberNotification.updateMany({
      where: {
        memberId: memberId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  // * Make Notification as Read (Member)
  async makeNotificationReadMember(memberId: string, notificationId: string) {
    // * check if notification is exist
    const notification = await this.findOneNotificationMember(
      memberId,
      notificationId,
    );

    // * Check it if already mark as read
    if (notification.isRead) {
      throw new ConflictException('The Notification Already Mark As Read');
    }

    return await this.prisma.memberNotification.update({
      where: {
        id: notification.id,
      },
      data: {
        isRead: true,
      },
    });
  }
}
