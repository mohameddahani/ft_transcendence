import { VisitStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class VisitCron {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  // * Check for expired visits and update their status from READY to EXPIRED
  async expireVisits() {
    await this.prisma.visit.updateMany({
      where: {
        visitStatus: VisitStatus.READY,
        visitDateAndTimeExpiresAt: {
          lte: new Date(),
        },
      },
      data: {
        visitStatus: VisitStatus.EXPIRED,
      },
    });
  }
}
