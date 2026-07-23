import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActiveSubscriptionDto } from './dtos/active-subscription.dto';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  AccountStatus,
  SubscriptionStatus,
  UserType,
} from '@/generated/prisma/enums';

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

    // * Check Status of user
    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new ForbiddenException(
        'This account is not active. Please activate your account before subscribing.',
      );
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

    // * Check if plan is active
    if (!newPlan.isActive) {
      throw new ConflictException(
        'The selected plan is no longer available. Please choose another active plan.',
      );
    }

    // * check if user try to do downground and he has already users more that plan
    // * Count Members
    const membersCount = await this.prisma.member.count({
      where: {
        adminId: user.id,
      },
    });
    if (membersCount >= newPlan.maxMembers) {
      throw new ForbiddenException(
        `Plan downgrade is not allowed. You currently have ${membersCount} members, but the selected plan supports a maximum of ${newPlan.maxMembers} members.`,
      );
    }

    // * Check if duration is already exist for this plan
    const duration = await this.prisma.planDuration.findFirst({
      where: {
        id: data.planDurationId,
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

    // * Create date of expiration
    const expiresAt = new Date(); // ex: 2026-06-19 20:30:15
    expiresAt.setDate(expiresAt.getDate() + duration.durationDays); // 19 + 30 => July 19th

    // * Has already subscription
    if (subscription) {
      // * Already same plan
      if (
        subscription.planId === newPlan.id &&
        subscription.planDurationId === duration.id &&
        subscription.status === SubscriptionStatus.ACTIVE
      ) {
        throw new ConflictException('You already have this subscription');
      }

      // * Upgrade / change plan
      return this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          plan: { connect: { id: newPlan.id } },
          planDuration: { connect: { id: duration.id } },
          status: SubscriptionStatus.ACTIVE,
          startedAt: new Date(),
          expiresAt: expiresAt,
          amount: duration.price,
        },
      });
    }

    // *  No subscription
    return this.prisma.subscription.create({
      data: {
        user: { connect: { id: user.id } },
        plan: { connect: { id: newPlan.id } },
        planDuration: { connect: { id: duration.id } },
        expiresAt: expiresAt,
        amount: duration.price,
      },
    });
  }

  // * Cancel Subscription
  async cancelSubscription(userId: string) {
    // * Check if user all ready exist
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
        userType: { notIn: [UserType.OWNER, UserType.USER] },
      },
      include: {
        subscription: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    // * Check if Subscription is exist befor update it
    // * Check if user has a subscription
    if (!user.subscription) {
      throw new NotFoundException('No subscription was found for this user.');
    }

    // * Check the subscription is Active
    if (user.subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        'Only active subscriptions can be cancelled.',
      );
    }

    await this.prisma.subscription.update({
      where: {
        id: user.subscription.id,
      },
      data: {
        status: SubscriptionStatus.CANCELLED,
      },
    });
  }

  // * Get all Subscriptions
  async findAll(page: number, limit: number) {
    const subscriptions = await this.prisma.subscription.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: {
        plan: true,
        planDuration: true,
      },
    });
    if (subscriptions.length === 0) {
      throw new NotFoundException('No subscriptions To Show');
    }

    return subscriptions;
  }

  // * Get one Subscription
  async findOne(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        id: subscriptionId,
      },
      include: {
        plan: true,
        planDuration: true,
      },
    });
    if (!subscription) {
      throw new NotFoundException('No subscription To Show');
    }

    return subscription;
  }
}
