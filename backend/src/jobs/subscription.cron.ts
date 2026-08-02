import { SubscriptionStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SubscriptionCron {
  constructor(private readonly prisma: PrismaService) {}

  // * Check if subscriptions is expired to switch subscription status from ACTIVE to EXPIRED
  @Cron(CronExpression.EVERY_HOUR)
  async expireSubscriptions() {
    await this.prisma.subscription.updateMany({
      where: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        expiresAt: {
          lte: new Date(),
        },
      },
      data: {
        subscriptionStatus: SubscriptionStatus.EXPIRED,
      },
    });
  }
}
