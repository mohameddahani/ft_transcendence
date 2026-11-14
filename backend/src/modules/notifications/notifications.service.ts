import { NotificationType } from '@/generated/prisma/enums';
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
    _search?: string,
    notificationType?: NotificationType,
    isRead?: boolean,
  ) {
    // * remove spaces
    const search = _search?.trim();

    const notifications = await this.prisma.memberNotification.findMany({
      where: {
        memberId: memberId,

        // * Filter by notification type.
        ...(notificationType !== undefined ? { notificationType } : {}),

        // * Filter by read or unread status.
        ...(isRead !== undefined ? { isRead } : {}),

        // * Search notification title or message.
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { message: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });

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
    _search?: string,
    notificationType?: NotificationType,
    isRead?: boolean,
  ) {
    // * remove spaces
    const search = _search?.trim();

    const notifications = await this.prisma.adminNotification.findMany({
      where: {
        adminId: adminId,

        // * Filter by notification type.
        ...(notificationType !== undefined ? { notificationType } : {}),

        // * Filter by read or unread status.
        ...(isRead !== undefined ? { isRead } : {}),

        // * Search notification title or message.
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { message: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });

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

  // * Get All Stats of Notification (Admin)
  async notificationStats(adminId: string) {
    // * await Promise.all: runs multiple independent async operations concurrently
    // * and waits until all of them are fulfilled. If one fails, Promise.all rejects.
    const [statusStats, isReadStats] = await Promise.all([
      this.prisma.adminNotification.groupBy({
        by: ['notificationType'],
        where: {
          adminId: adminId,
        },
        _count: {
          _all: true,
        },
      }),

      this.prisma.adminNotification.groupBy({
        by: ['isRead'],
        where: {
          adminId: adminId,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    let paymentReminderCount = 0;
    let membershipExpirationCount = 0;
    let subscriptionExpirationCount = 0;
    let customCount = 0;
    let isReadCount = 0;
    let isNotReadCount = 0;

    for (const stat of statusStats) {
      if (stat.notificationType === NotificationType.PAYMENT_REMINDER) {
        paymentReminderCount = stat._count._all;
      }
      if (stat.notificationType === NotificationType.MEMBERSHIP_EXPIRATION) {
        membershipExpirationCount = stat._count._all;
      }
      if (stat.notificationType === NotificationType.SUBSCRIPTION_EXPIRATION) {
        subscriptionExpirationCount = stat._count._all;
      }
      if (stat.notificationType === NotificationType.CUSTOM) {
        customCount = stat._count._all;
      }
    }

    for (const stat of isReadStats) {
      if (stat.isRead) {
        isReadCount = stat._count._all;
      } else {
        isNotReadCount = stat._count._all;
      }
    }

    return {
      paymentReminderCount,
      membershipExpirationCount,
      subscriptionExpirationCount,
      customCount,
      isReadCount,
      isNotReadCount,
      total: isReadCount + isNotReadCount,
    };
  }

  // * Make All Notification as Read (Member)
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

  // * Get All Stats of Notification (Member)
  async notificationStatsOfMember(memberId: string) {
    // * await Promise.all: runs multiple independent async operations concurrently
    // * and waits until all of them are fulfilled. If one fails, Promise.all rejects.
    const [statusStats, isReadStats] = await Promise.all([
      this.prisma.memberNotification.groupBy({
        by: ['notificationType'],
        where: {
          memberId: memberId,
        },
        _count: {
          _all: true,
        },
      }),

      this.prisma.memberNotification.groupBy({
        by: ['isRead'],
        where: {
          memberId: memberId,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    let paymentReminderCount = 0;
    let membershipExpirationCount = 0;
    let subscriptionExpirationCount = 0;
    let customCount = 0;
    let isReadCount = 0;
    let isNotReadCount = 0;

    for (const stat of statusStats) {
      if (stat.notificationType === NotificationType.PAYMENT_REMINDER) {
        paymentReminderCount = stat._count._all;
      }
      if (stat.notificationType === NotificationType.MEMBERSHIP_EXPIRATION) {
        membershipExpirationCount = stat._count._all;
      }
      if (stat.notificationType === NotificationType.SUBSCRIPTION_EXPIRATION) {
        subscriptionExpirationCount = stat._count._all;
      }
      if (stat.notificationType === NotificationType.CUSTOM) {
        customCount = stat._count._all;
      }
    }

    for (const stat of isReadStats) {
      if (stat.isRead) {
        isReadCount = stat._count._all;
      } else {
        isNotReadCount = stat._count._all;
      }
    }

    return {
      paymentReminderCount,
      membershipExpirationCount,
      subscriptionExpirationCount,
      customCount,
      isReadCount,
      isNotReadCount,
      total: isReadCount + isNotReadCount,
    };
  }
}
