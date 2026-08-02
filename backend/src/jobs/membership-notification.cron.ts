import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export class MembershipNotificationCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async createNotification() {
    // * Get Payments of Members and Check it if OVERDUE
    // const payment = await this.prisma.payment.findMany({
    // where: {
    // status:
    // }
    // })
    // await this.prisma.memberNotification.create({})
  }
}
