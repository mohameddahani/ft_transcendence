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
}
