import { NotificationType, PaymentStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MembershipNotificationCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async createNotification() {
    // * Get Payments of Members and Check it if OVERDUE
    const payments = await this.prisma.payment.findMany({
      where: {
        paymentStatus: PaymentStatus.DUE_SOON,
        expirationNotifiedAt: null,
      },
    });

    if (payments.length === 0) {
      return;
    }

    // * Create Notification to all this payments
    for (const payment of payments) {
      await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.payment.updateMany({
          where: {
            id: payment.id,
            paymentStatus: PaymentStatus.DUE_SOON,
            expirationNotifiedAt: null,
          },
          data: {
            expirationNotifiedAt: new Date(),
          },
        });

        if (count === 0) {
          return;
        }

        await tx.memberNotification.create({
          data: {
            member: { connect: { id: payment.memberId } },
            notificationType: NotificationType.PAYMENT_REMINDER,
            title: 'Membership Payment Due Soon',
            message:
              'Your membership payment is due soon. Please complete your payment before the due date.',
          },
        });
      });
    }
  }
}
