import { PrismaService } from '@/prisma/prisma.service';
import { AddMemebershipPlanDto } from '@/membership-plans/dtos/add-membership-plan.dto';
import { Injectable, UnauthorizedException } from '@nestjs/common';

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
        durationDays: data.durationDays,
        price: data.price,
        description: data.description,
        admin: { connect: { id: adminId } },
      },
    });
  }
}
