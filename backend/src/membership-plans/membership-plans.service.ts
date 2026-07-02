import { PrismaService } from '@/prisma/prisma.service';
import { AddMembershipPlanDto } from '@/membership-plans/dtos/add-membership-plan.dto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AddMembershipPlanDurationDto } from './dtos/add-membership-plan-duration.dto';
import { MembershipStatus, SubscriptionStatus } from '@/generated/prisma/enums';
import { UpdateMembershipPlanDto } from './dtos/update-membership-plan.dto';
import { UpdateMembershipPlanDurationDto } from './dtos/update-membership-plan-duration.dto';

@Injectable()
export class MembershipPlansService {
  constructor(private readonly prisma: PrismaService) {}

  // * Add Membership plan
  async addMembershipPlan(adminId: string, data: AddMembershipPlanDto) {
    // * Check if admin has subscription
    await this.checkIfAdminHasSubscription(adminId);

    // * Check if membership plan already exist
    const membershipPlan = await this.prisma.membershipPlan.findFirst({
      where: {
        AND: [{ adminId: adminId }, { planName: data.planName }],
      },
    });

    if (membershipPlan) {
      throw new UnauthorizedException('Membership Plan already exists');
    }

    // * Add membership plan to database
    await this.prisma.membershipPlan.create({
      data: {
        admin: { connect: { id: adminId } },
        planName: data.planName,
        description: data.description,
      },
    });
  }

  // * Add Membership Duration
  async addMembershipPlanDuration(
    adminId: string,
    data: AddMembershipPlanDurationDto,
  ) {
    // * Check if admin has subscription
    await this.checkIfAdminHasSubscription(adminId);

    // * Check if membership plan exist
    const membershipPlan = await this.prisma.membershipPlan.findUnique({
      where: {
        id: data.membershipPlanId,
      },
    });
    if (!membershipPlan) {
      throw new NotFoundException('Membership Not Found');
    }

    // * Check if plan duration already exist
    const existingMembershipPlanDuration =
      await this.prisma.membershipPlanDuration.findFirst({
        where: {
          AND: [
            { membershipPlanId: data.membershipPlanId },
            { durationDays: data.durationDays },
            { price: data.price },
          ],
        },
      });
    if (existingMembershipPlanDuration) {
      throw new UnauthorizedException(
        'Membership Plan Duration already exists',
      );
    }

    // * Add plan duration to database
    await this.prisma.membershipPlanDuration.create({
      data: {
        durationDays: data.durationDays,
        price: data.price,
        membershipPlan: { connect: { id: data.membershipPlanId } },
      },
    });
  }

  // * Update Membership Plan
  async update(adminId: string, id: string, data: UpdateMembershipPlanDto) {
    // * Check if admin has subscription
    await this.checkIfAdminHasSubscription(adminId);

    // * Check if this membership plan already exist
    const membershipPlan = await this.findOne(adminId, id);

    // * Check data if already exist in DB
    if (data.planName !== undefined) {
      const existingData = await this.prisma.membershipPlan.findFirst({
        where: {
          id: {
            not: id,
          },
          adminId: adminId,
          planName: data.planName,
        },
      });
      if (existingData) {
        // * 409 = duplicate data
        throw new ConflictException('Membership Plan Name already exists');
      }
    }

    // * Check if status of membership plan will be updated
    if (data.isActive !== undefined) {
      if (!data.isActive) {
        // * Check if any member use this membership plan before desactive it
        const NumMembers = await this.prisma.membership.count({
          where: {
            adminId: adminId,
            membershipPlanId: membershipPlan.id,
            status: MembershipStatus.ACTIVE,
          },
        });
        if (NumMembers > 0) {
          throw new BadRequestException(
            `The Are ${NumMembers} Member Use This Membership Plan`,
          );
        }
      }
    }

    // * Update data
    await this.prisma.membershipPlan.update({
      where: {
        id: id,
        adminId: adminId,
      },
      data,
    });
  }

  // * Update a Membership Plan Duration
  async updateMembershipPlanDuration(
    adminId: string,
    id: string,
    data: UpdateMembershipPlanDurationDto,
  ) {
    // * Check if admin has subscription
    await this.checkIfAdminHasSubscription(adminId);

    // * Check the membership plan if already exist
    const membershipPlan = await this.findOne(adminId, data.membershipPlanId);

    // * Check duration if already exist in this membership plan
    const duration = await this.prisma.membershipPlanDuration.findUnique({
      where: { id: id, membershipPlanId: membershipPlan.id },
    });
    if (!duration) {
      throw new NotFoundException('Duration Membership Plan Not Found!');
    }

    // * check if Duration is Duplicate in Plan
    if (data.durationDays !== undefined && data.price !== undefined) {
      const existingMembershipPlanDuration =
        await this.prisma.membershipPlanDuration.findFirst({
          where: {
            AND: [
              { membershipPlanId: data.membershipPlanId },
              { durationDays: data.durationDays },
              { price: data.price },
            ],
          },
        });

      if (existingMembershipPlanDuration) {
        throw new UnauthorizedException(
          'Membership Plan Duration is Duplicate',
        );
      }
    } else if (data.price !== undefined) {
      const existingMembershipPlanDuration =
        await this.prisma.membershipPlanDuration.findFirst({
          where: {
            AND: [
              { membershipPlanId: data.membershipPlanId },
              { durationDays: duration.durationDays },
              { price: data.price },
            ],
          },
        });

      if (existingMembershipPlanDuration) {
        throw new UnauthorizedException(
          'Membership Plan Duration is Duplicate',
        );
      }
    } else if (data.durationDays !== undefined) {
      const existingMembershipPlanDuration =
        await this.prisma.membershipPlanDuration.findFirst({
          where: {
            AND: [
              { membershipPlanId: data.membershipPlanId },
              { durationDays: data.durationDays },
              { price: duration.price },
            ],
          },
        });

      if (existingMembershipPlanDuration) {
        throw new UnauthorizedException(
          'Membership Plan Duration is Duplicate',
        );
      }
    }

    // * Update data
    await this.prisma.membershipPlanDuration.update({
      where: {
        id: id,
      },
      data,
    });
  }

  // * Get all membership Plans
  async findAll(adminId: string, page: number, limit: number) {
    const membershipPlan = await this.prisma.membershipPlan.findMany({
      where: {
        adminId,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        membershipPlanDurations: true,
      },
    });
    if (membershipPlan.length === 0) {
      throw new NotFoundException('No Membersship Plan To Show');
    }

    return membershipPlan;
  }

  // * Get one membership Plan
  async findOne(adminId: string, membershipPlanId: string) {
    const membershipPlan = await this.prisma.membershipPlan.findFirst({
      where: {
        adminId,
        id: membershipPlanId,
      },
      include: {
        membershipPlanDurations: true,
      },
    });
    if (!membershipPlan) {
      throw new NotFoundException('Membership Plan Not Found!');
    }

    return membershipPlan;
  }

  // ! Private Attributes
  // * Check if admin has subscription
  private async checkIfAdminHasSubscription(adminId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId: adminId, status: SubscriptionStatus.ACTIVE },
      include: {
        plan: true,
      },
    });
    if (!subscription || !subscription.plan.isActive) {
      throw new UnauthorizedException(
        'You don’t have an active subscription. Upgrade your plan to continue.',
      );
    }
  }
}
