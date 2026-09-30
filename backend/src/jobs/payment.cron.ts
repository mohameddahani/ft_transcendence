import { PaymentStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { endOfTomorrow, startOfTomorrow } from 'date-fns';

@Injectable()
export class PaymentCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async updatePaidPayments() {
    // * Create Range Of Date
    const start = startOfTomorrow();
    const end = endOfTomorrow();

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
        paymentStatus: PaymentStatus.DUE_SOON,
      },
    });
  }

  // * Change Status of Payments that Overdue to Unpaid
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateOverduePayments() {
    await this.prisma.payment.updateMany({
      where: {
        paymentStatus: PaymentStatus.DUE_SOON,
        dueDate: { lt: new Date() },
      },
      data: {
        paymentStatus: PaymentStatus.UNPAID,
      },
    });
  }
}
