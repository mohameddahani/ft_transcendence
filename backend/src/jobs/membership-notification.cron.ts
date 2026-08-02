import { NotificationType, PaymentStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export class MembershipNotificationCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async createNotification() {
    // * Get Payments of Members and Check it if OVERDUE
    const payments = await this.prisma.payment.findMany({
      where: {
        paymentStatus: PaymentStatus.OVERDUE,
      },
    });

    if (payments.length === 0) {
      return;
    }

    // * Create Notification to all this payments
    for (let i = 0; i < payments.length; i++) {
      await this.prisma.memberNotification.create({
        data: {
          member: { connect: { id: payments[i].memberId } },
          notificationType: NotificationType.MEMBERSHIP_EXPIRATION,
          title: 'Membership Payment Overdue',
          message:
            'Your membership payment is overdue. Please complete your payment to keep your membership active.',
        },
      });
    }
  }
}
