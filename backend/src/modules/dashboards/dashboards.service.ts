import { AccessesService } from '@/core/access/access.service';
import { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { AccountStatus, MembershipStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessesService: AccessesService,
  ) {}

  // * Get All Stats of Dashboard (Admin / Staff)
  async dashboardStats(accessTokenPayload: AccessTokenPayload) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    // * Run independent queries concurrently
    const [
      statusStats,
      expiredMembers,
      totalPlans,
      totalReviews,
      satisfiedReviews,
    ] = await Promise.all([
      // * Count Members Grouped by Account Status
      this.prisma.member.groupBy({
        by: ['accountStatus'],
        where: {
          adminId,
        },
        _count: {
          _all: true,
        },
      }),

      // * Count Members With an Expired Membership and No Active Membership
      this.prisma.member.count({
        where: {
          adminId,
          memberships: {
            some: {
              membershipStatus: MembershipStatus.EXPIRED,
            },
            none: {
              membershipStatus: MembershipStatus.ACTIVE,
            },
          },
        },
      }),

      // * Count All Membership Plans
      this.prisma.membershipPlan.count({
        where: {
          adminId,
        },
      }),

      // * Count All Feedbacks
      this.prisma.feedback.count({
        where: {
          adminId,
        },
      }),

      // * Count Feedbacks With a Rating Above 4
      this.prisma.feedback.count({
        where: {
          adminId,
          rating: {
            gt: 4,
          },
        },
      }),
    ]);

    let activeMembers = 0;
    let pendingMembers = 0;
    let bannedMembers = 0;
    let totalMembers = 0;

    for (const stat of statusStats) {
      if (stat.accountStatus === AccountStatus.ACTIVE) {
        activeMembers = stat._count._all;
      }

      if (stat.accountStatus === AccountStatus.PENDING) {
        pendingMembers = stat._count._all;
      }

      if (stat.accountStatus === AccountStatus.BANNED) {
        bannedMembers = stat._count._all;
      }
    }

    // * Calculate the percentage of satisfied reviews, rounded to the nearest whole number; return 0 if there are no reviews.
    const satisfactionScore =
      totalReviews === 0
        ? 0
        : Math.round((satisfiedReviews / totalReviews) * 100); // Math.round(95.4) => 95 | Math.round(95.5); => | 96 Math.round(95.8); => 96

    totalMembers = activeMembers + pendingMembers + bannedMembers;

    return {
      dashboard: {
        totalMembers,
        activeMembers,
        inactiveMembers: totalMembers - activeMembers,
        expiredMembers,
        bannedMembers,
        totalPlans,
        satisfactionScore,
        totalReviews,
      },
    };
  }
}
