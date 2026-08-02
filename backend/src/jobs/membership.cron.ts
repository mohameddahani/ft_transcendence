import { MembershipStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MembershipCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async expireMembershipPlans() {
    // * Check if membership is expired to switch membership status from ACTIVE to EXPIRED
    await this.prisma.membership.updateMany({
      where: {
        membershipStatus: MembershipStatus.ACTIVE,
        expiresAt: {
          lte: new Date(),
        },
      },
      data: {
        membershipStatus: MembershipStatus.EXPIRED,
      },
    });
  }
}
