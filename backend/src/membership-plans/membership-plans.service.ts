import { PrismaService } from '@/prisma/prisma.service';
import { AddMemebershipPlanDto } from '@/membership-plans/dtos/add-membership-plan.dto';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AddMemebershipPlanDurationDto } from './dtos/add-membership-plan-duration.dto';

@Injectable()
export class MembershipPlanService {
  constructor(private readonly prisma: PrismaService) {}

  // * Add Membership plan
  async addMembershipPlan(adminId: string, data: AddMemebershipPlanDto) {
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
  async addMembershipPlanDuration(data: AddMemebershipPlanDurationDto) {
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
    const membershipPlan = await this.prisma.membershipPlan.findUnique({
      where: {
        adminId,
        id: membershipPlanId,
      },
      include: {
        membershipPlanDurations: true,
      },
    });
    if (!membershipPlan) {
      throw new NotFoundException('No Membership To Show');
    }

    return membershipPlan;
  }
}
