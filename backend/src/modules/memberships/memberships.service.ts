import {
  UserAccountStatus,
  MembershipStatus,
  SubscriptionStatus,
} from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  // * Get All Memberships
  async findAll(adminId: string, page: number, limit: number) {
    // * Check if admin has subscription
    await this.checkIfAdminHasSubscription(adminId);

    const memberships = await this.prisma.membership.findMany({
      where: {
        adminId: adminId,
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        member: {
          omit: { password: true },
        },
        membershipPlan: true,
        membershipPlanDuration: true,
        status: true,
        startDate: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (memberships.length === 0) {
      throw new NotFoundException('Memberships Not Found!');
    }

    return memberships;
  }

  // * Get One Membership
  async findOne(adminId: string, membershipId: string) {
    // * Check if admin has subscription
    await this.checkIfAdminHasSubscription(adminId);

    const membership = await this.prisma.membership.findFirst({
      where: {
        id: membershipId,
        adminId: adminId,
      },
      select: {
        id: true,
        member: {
          omit: { password: true },
        },
        membershipPlan: true,
        membershipPlanDuration: true,
        status: true,
        startDate: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!membership) {
      throw new NotFoundException('Membership Not Found!');
    }

    return membership;
  }

  // * Get Membership of Member
  async findMyMembership(memberId: string) {
    // * Check membership is exist
    const memberships = await this.prisma.membership.findFirst({
      where: {
        memberId: memberId,
        status: MembershipStatus.ACTIVE,
      },
      select: {
        membershipPlan: true,
        membershipPlanDuration: true,
        status: true,
        startDate: true,
        expiresAt: true,
      },
    });

    if (!memberships) {
      throw new NotFoundException('No Active Membership Found');
    }

    return memberships;
  }

  // * Get All Memberships of Member
  async findAllMemberships(memberId: string, page: number, limit: number) {
    const memberships = await this.prisma.membership.findMany({
      where: {
        memberId: memberId,
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        membershipPlan: true,
        membershipPlanDuration: true,
        status: true,
        startDate: true,
        expiresAt: true,
      },
    });

    if (memberships.length === 0) {
      throw new NotFoundException('There No Memberships To Show');
    }

    return memberships;
  }

  // ! Private Atributes
  // * Check if admin has subscription
  private async checkIfAdminHasSubscription(adminId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId: adminId, status: SubscriptionStatus.ACTIVE },
      include: { plan: true, user: true },
    });
    if (!subscription || !subscription.plan.isActive) {
      throw new UnauthorizedException(
        'You don’t have an active subscription. Upgrade your plan to continue.',
      );
    } else if (subscription.user.accountStatus !== UserAccountStatus.ACTIVE) {
      if (subscription.user.accountStatus === UserAccountStatus.INACTIVE) {
        throw new UnauthorizedException(
          'Your account is inactive. Please activate your account to continue.',
        );
      } else if (
        subscription.user.accountStatus === UserAccountStatus.PENDING
      ) {
        throw new UnauthorizedException(
          'Your account is currently pending approval. Please wait until your account has been reviewed, or Please contact support for assistance.',
        );
      } else if (subscription.user.accountStatus === UserAccountStatus.BANNED) {
        throw new UnauthorizedException(
          'Your account has been suspended. Please contact support for assistance.',
        );
      }
    }

    return subscription;
  }
}
