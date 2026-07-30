import {
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
  Role,
} from '@/generated/prisma/enums';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  // * Active Subscription
  async activeSubscription(data: ActiveSubscriptionDto) {
    // * Check if admin is already exist
    const user = await this.prisma.user.findUnique({
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
    const newPlan = await this.prisma.plan.findUnique({
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
    if (membersCount > newPlan.maxMembers) {
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
        status: SubscriptionStatus.ACTIVE,
      },
    });

    // * Has already subscription

    // * Create date of expiration
    const expiresAt = new Date(); // ex: 2026-06-19 20:30:15
    expiresAt.setDate(expiresAt.getDate() + duration.durationDays); // 19 + 30 => July 19th
    if (subscription) {
      // * Already same plan
      if (
        subscription.planId === newPlan.id &&
        subscription.planDurationId === duration.id &&
        subscription.status === SubscriptionStatus.ACTIVE
      ) {
        throw new ConflictException('You already have this subscription');
      }

      // * Use Transaction

      await this.prisma.$transaction([
        // * Make the old Subscription expired
        this.prisma.subscription.update({
          where: {
            id: subscription.id,
          },
          data: {
            status: SubscriptionStatus.EXPIRED,
          },
        }),

        // *  Upgrade / change plan
        this.prisma.subscription.create({
          data: {
            user: { connect: { id: user.id } },
            plan: { connect: { id: newPlan.id } },
            planDuration: { connect: { id: duration.id } },
            expiresAt: expiresAt,
            amount: duration.price,
          },
        }),
      ]);
    } else {
      // *  No subscription
      return await this.prisma.subscription.create({
        data: {
          user: { connect: { id: user.id } },
          plan: { connect: { id: newPlan.id } },
          planDuration: { connect: { id: duration.id } },
          expiresAt: expiresAt,
          amount: duration.price,
        },
      });
    }
  }

  // * Cancel Subscription
  async cancelSubscription(adminId: string) {
    // * Check User
    const user = await this.prisma.user.findFirst({
      where: {
        id: adminId,
        role: {
          notIn: [Role.OWNER, Role.MEMBER],
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    // * Check Subscription is Active
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId: adminId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription was found');
    }

    // * Cancel the Subscription
    await this.prisma.subscription.update({
      where: {
        id: subscription.id,
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
        user: true,
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
        user: true,
        plan: true,
        planDuration: true,
      },
    });
    if (!subscription) {
      throw new NotFoundException('No subscription To Show');
    }

    return subscription;
  }

  // ! Services Of Admin

  // * Get Subscription of Admin
  async findMySubscription(adminId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId: adminId,
        status: SubscriptionStatus.ACTIVE,
      },
      select: {
        plan: true,
        planDuration: true,
        status: true,
        startedAt: true,
        expiresAt: true,
        amount: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('No Active Subscription Found');
    }

    return subscription;
  }

  // * Get All Subscriptions of Admin
  async findAllSubscriptions(adminId: string, page: number, limit: number) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userId: adminId,
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        plan: true,
        planDuration: true,
        status: true,
        startedAt: true,
        expiresAt: true,
        amount: true,
      },
    });

    if (subscriptions.length === 0) {
      throw new NotFoundException('No Subscriptions Found');
    }

    return subscriptions;
  }
}
