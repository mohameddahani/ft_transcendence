import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActiveSubscriptionDto } from './dtos/active-subscription.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  // * Active Subscription
  async activeSubscription(data: ActiveSubscriptionDto) {
    // * Check if admin is already exist
    const user = await this.prisma.user.findFirst({
      where: {
        userName: data.userName,
      },
    });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    // * Check if plan is already exist
    const newPlan = await this.prisma.plan.findFirst({
      where: {
        id: data.planId,
      },
    });
    if (!newPlan) {
      throw new NotFoundException('Plan Not Found');
    }

    // * Check if duration is already exist for this plan
    const duration = await this.prisma.planDuration.findFirst({
      where: {
        id: data.durationId,
        planId: data.planId,
      },
    });
    if (!duration) {
      throw new NotFoundException('Duration does not exist for this plan');
    }

    // * Check if admin is has already a subscription
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId: user.id,
      },
    });
    // * No subscription
    if (!subscription) {
      // * Create date of expiration
      const expiresAt = new Date(); // ex: 2026-06-19 20:30:15
      expiresAt.setDate(expiresAt.getDate() + duration.durationDays); // 19 + 30 => July 19th
      return this.prisma.subscription.create({
        data: {
          user: { connect: { id: user.id } },
          plan: { connect: { id: newPlan.id } },
          expiresAt: expiresAt,
          amount: duration.price,
        },
      });
    }

    // * Already same plan
    if (subscription.planId === newPlan.id) {
      throw new ConflictException('You already have this subscription');
    }

    // * Upgrade / change plan
    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: newPlan.id,
      },
    });
  }
}
