import { MembershipStatus, NotificationType } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addHours } from 'date-fns';

@Injectable()
export class MembershipNotificationCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async createNotification() {
    // * Create Range Of Date
    const now = new Date();
    const tomorrow = addHours(now, 24);

    // * Get Membership That Will Be Expired After 24H
    const memberships = await this.prisma.membership.findMany({
      where: {
        membershipStatus: MembershipStatus.ACTIVE,
        expiresAt: {
          gt: now,
          lte: tomorrow,
        },
        expirationNotifiedAt: null,
      },
    });

    if (memberships.length === 0) {
      return;
    }

    // * Create Notification to all this payments
    for (const membership of memberships) {
      await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.membership.updateMany({
          where: {
            id: membership.id,
            membershipStatus: MembershipStatus.ACTIVE,
            expiresAt: {
              equals: membership.expiresAt,
              gt: now,
              lte: tomorrow,
            },
            expirationNotifiedAt: null,
          },
          data: {
            expirationNotifiedAt: now,
          },
        });

        if (count === 0) {
          return;
        }

        await tx.memberNotification.create({
          data: {
            member: { connect: { id: membership.memberId } },
            notificationType: NotificationType.MEMBERSHIP_EXPIRATION,
            title: 'Membership Expiring Soon',
            message:
              'Your membership will expire within the next 24 hours. Please renew your membership to continue accessing the club.',
          },
        });
      });
    }
  }
}
