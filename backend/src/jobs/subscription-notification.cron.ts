import { NotificationType, SubscriptionStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SubscriptionNotificationCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async createNotification() {
    // * Create Range Of Date
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    start.setDate(end.getDate() + 1);
    start.setHours(23, 59, 59, 999);

    // * Get All subscriptions that will exipred after 1 day
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        expiresAt: {
          gte: start,
          lte: end,
        },
      },
    });

    if (subscriptions.length === 0) {
      return;
    }

    // * Create Notification to all this susbscriptions
    for (let i = 0; i < subscriptions.length; i++) {
      await this.prisma.adminNotification.create({
        data: {
          admin: { connect: { id: subscriptions[i].userId } },
          notificationType: NotificationType.SUBSCRIPTION_EXPIRATION,
          title: 'Subscription Payment Overdue',
          message:
            'Your Subscription payment is overdue. Please complete your payment to keep your Subscription active.',
        },
      });
    }
  }
}
