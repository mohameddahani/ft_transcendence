import { MembershipStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export class MembershipCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async expireMembershipPlans() {
    await this.prisma.membership.updateMany({
      where: {
        status: MembershipStatus.ACTIVE,
        expiresAt: {
          lte: new Date(),
        },
      },
      data: {
        status: MembershipStatus.EXPIRED,
      },
    });
  }
}
