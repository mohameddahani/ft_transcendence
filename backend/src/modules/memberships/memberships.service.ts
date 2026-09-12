import { MembershipStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionsService } from '../platform/subscriptions/subscriptions.service';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // * Get All Memberships
  async findAll(adminId: string, page: number, limit: number) {
    // * Check if admin has subscription
    await this.subscriptionsService.checkIfAdminHasSubscription(adminId);

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
        membershipStatus: true,
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
    await this.subscriptionsService.checkIfAdminHasSubscription(adminId);

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
        membershipStatus: true,
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
        membershipStatus: MembershipStatus.ACTIVE,
      },
      select: {
        membershipPlan: true,
        membershipPlanDuration: true,
        membershipStatus: true,
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
        membershipStatus: true,
        startDate: true,
        expiresAt: true,
      },
    });

    if (memberships.length === 0) {
      throw new NotFoundException('There No Memberships To Show');
    }

    return memberships;
  }
}
