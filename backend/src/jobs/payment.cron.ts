import { PaymentStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PaymentCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async updatePaidPayments() {
    // * Create Range Of Date
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setDate(end.getDate() + 1);
    end.setHours(23, 59, 59, 999);

    // * Change Status of Payments that will be late on 1 day from Paid to Overdue
    await this.prisma.payment.updateMany({
      where: {
        paymentStatus: PaymentStatus.PAID,
        dueDate: {
          gte: start,
          lte: end,
        },
      },
      data: {
        paymentStatus: PaymentStatus.OVERDUE,
      },
    });
  }

  // * Change Status of Payments that Overdue to Unpaid
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateOverduePayments() {
    await this.prisma.payment.updateMany({
      where: {
        paymentStatus: PaymentStatus.OVERDUE,
        dueDate: { lt: new Date() },
      },
      data: {
        paymentStatus: PaymentStatus.UNPAID,
      },
    });
  }
}
