import { MemberStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export class MembershipPlanCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async expireMembershipPlans() {
    await this.prisma.member.updateMany({
      where: {
        status: MemberStatus.ACTIVE,
        expiresAt: {
          lte: new Date(),
        },
      },
      data: {
        status: MemberStatus.EXPIRED,
      },
    });
  }
}
