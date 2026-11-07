import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { subDays } from 'date-fns';

@Injectable()
export class RemoveInactiveUsers {
  private readonly logger = new Logger(RemoveInactiveUsers.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async inactiveUsers() {
    // * Remove accounts that are still unverified after 7 days.
    const sevenDaysAgo = subDays(new Date(), 7);

    const result = await this.prisma.user.deleteMany({
      where: {
        isAccountVerified: false,

        createdAt: {
          lte: sevenDaysAgo,
        },
      },
    });

    if (result.count > 0) {
      this.logger.log(`Removed ${result.count} inactive users`);
    }
  }
}
