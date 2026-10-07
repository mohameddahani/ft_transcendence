import { NotificationType, SubscriptionStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addHours } from 'date-fns';

@Injectable()
export class SubscriptionNotificationCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async createNotification() {
    // * Create Range Of Date
    const now = new Date();
    const tomorrow = addHours(now, 24);

    // * Get All subscriptions that will exipred after 1 day
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        expiresAt: {
          gt: now,
          lte: tomorrow,
        },
        expirationNotifiedAt: null,
      },
    });

    if (subscriptions.length === 0) {
      return;
    }

    // * Create Notification to all this susbscriptions
    for (const subscription of subscriptions) {
      await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.subscription.updateMany({
          where: {
            id: subscription.id,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            expirationNotifiedAt: null,
            expiresAt: {
              equals: subscription.expiresAt,
              gt: now,
              lte: tomorrow,
            },
          },
          data: {
            expirationNotifiedAt: now,
          },
        });

        if (count === 0) {
          return;
        }

        await tx.adminNotification.create({
          data: {
            admin: { connect: { id: subscription.userId } },
            notificationType: NotificationType.SUBSCRIPTION_EXPIRATION,
            title: 'Subscription Expiring Soon',
            message:
              'Your subscription expires within 24 hours. Please renew it to keep your subscription active.',
          },
        });
      });
    }
  }
}
