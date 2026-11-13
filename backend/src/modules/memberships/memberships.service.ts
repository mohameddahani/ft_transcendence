import { MembershipStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { AccessesService } from '@/core/access/access.service';
import { publicMemberSelect } from '@/core/types/safe-selects.type';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessesService: AccessesService,
  ) {}

  // * Get All Memberships
  async findAll(
    accessTokenPayload: AccessTokenPayload,
    page: number,
    limit: number,
  ) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    const memberships = await this.prisma.membership.findMany({
      where: {
        adminId: adminId,
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        member: {
          select: publicMemberSelect,
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

    return memberships;
  }

  // * Get One Membership
  async findOne(accessTokenPayload: AccessTokenPayload, membershipId: string) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    const membership = await this.prisma.membership.findFirst({
      where: {
        id: membershipId,
        adminId: adminId,
      },
      select: {
        id: true,
        member: {
          select: publicMemberSelect,
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

  // * Get All Stats of Memebership (Admin / Staff)
  async membershipStats(accessTokenPayload: AccessTokenPayload) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    const membershipStats = await this.prisma.membership.groupBy({
      by: ['membershipStatus'],
      where: {
        adminId: adminId,
      },
      _count: {
        _all: true,
      },
    });

    let activeCount = 0;
    let expiredCount = 0;
    let cancelledCount = 0;

    for (const stat of membershipStats) {
      if (stat.membershipStatus === MembershipStatus.ACTIVE) {
        activeCount = stat._count._all;
      }

      if (stat.membershipStatus === MembershipStatus.EXPIRED) {
        expiredCount = stat._count._all;
      }

      if (stat.membershipStatus === MembershipStatus.CANCELLED) {
        cancelledCount = stat._count._all;
      }
    }

    return {
      activeCount,
      expiredCount,
      cancelledCount,
      total: activeCount + expiredCount + cancelledCount,
    };
  }

  // * Get Membership of Member
  async findMyMembership(memberId: string) {
    // * Get Admin Id from member
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

    // * Check that the admin account, subscription, and plan are active.
    await this.accessesService.validateAdminAccountAndSubscription(adminId);

    // * Check that the member account and membership are active.
    await this.accessesService.validateMemberAccountAndMembership(
      memberId,
      adminId,
    );

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
    // * Get Admin Id from member
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

    // * Check that the admin account, subscription, and plan are active.
    await this.accessesService.validateAdminAccountAndSubscription(adminId);

    // * Check that the member account and membership are active.
    await this.accessesService.validateMemberAccountAndMembership(
      memberId,
      adminId,
    );

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

    return memberships;
  }

  // * Get All Stats of Memebership (Member)
  async membershipStatsOfMember(memberId: string) {
    // * Get Admin Id from member
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

    // * Check that the admin account, subscription, and plan are active.
    await this.accessesService.validateAdminAccountAndSubscription(adminId);

    // * Check that the member account and membership are active.
    await this.accessesService.validateMemberAccountAndMembership(
      memberId,
      adminId,
    );

    const membershipStats = await this.prisma.membership.groupBy({
      by: ['membershipStatus'],
      where: {
        adminId: adminId,
        memberId: memberId,
      },
      _count: {
        _all: true,
      },
    });

    let activeCount = 0;
    let expiredCount = 0;
    let cancelledCount = 0;

    for (const stat of membershipStats) {
      if (stat.membershipStatus === MembershipStatus.ACTIVE) {
        activeCount = stat._count._all;
      }

      if (stat.membershipStatus === MembershipStatus.EXPIRED) {
        expiredCount = stat._count._all;
      }

      if (stat.membershipStatus === MembershipStatus.CANCELLED) {
        cancelledCount = stat._count._all;
      }
    }

    return {
      activeCount,
      expiredCount,
      cancelledCount,
      total: activeCount + expiredCount + cancelledCount,
    };
  }
}
