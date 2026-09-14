import { MembershipStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AccessesService } from '@/core/services/access.service';
import { AccessTokenPayload } from '@/core/types/jwt-payload.type';

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
    // * Get Admin id
    const adminId =
      await this.accessesService.getAdminIdFromAccessTokenPayloadOfStaff(
        accessTokenPayload,
      );

    // * Check if admin has subscription
    await this.accessesService.checkIfAdminHasSubscription(adminId);

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
  async findOne(accessTokenPayload: AccessTokenPayload, membershipId: string) {
    // * Get Admin id
    const adminId =
      await this.accessesService.getAdminIdFromAccessTokenPayloadOfStaff(
        accessTokenPayload,
      );

    // * Check if admin has subscription
    await this.accessesService.checkIfAdminHasSubscription(adminId);

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
