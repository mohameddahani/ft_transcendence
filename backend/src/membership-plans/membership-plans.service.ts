import { PrismaService } from '@/prisma/prisma.service';
import { AddMembershipPlanDto } from '@/membership-plans/dtos/add-membership-plan.dto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AddMembershipPlanDurationDto } from './dtos/add-membership-plan-duration.dto';
import { SubscriptionStatus } from '@/generated/prisma/enums';
import { UpdateMembershipPlanDto } from './dtos/update-membership-plan.dto';

@Injectable()
export class MembershipPlanService {
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
        planName: data.planName,
        description: data.description,
        admin: { connect: { id: adminId } },
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

    // * Check if membership exist
    const membership = await this.prisma.membershipPlan.findUnique({
      where: {
        id: data.membershipPlanId,
      },
    });
    if (!membership) {
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
    // * Check if this membership plan already exist
    await this.findOne(adminId, id);

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
        console.log(data.planName);
        // * 409 = duplicate data
        throw new ConflictException('Membership Plan Name already exists');
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
    });
    if (!subscription) {
      throw new UnauthorizedException(
        'You don’t have an active subscription. Upgrade your plan to continue.',
      );
    }
  }
}
