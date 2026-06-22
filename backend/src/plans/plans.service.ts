import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AddPlanDto } from './dtos/add-plan.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { AddPlanDurationDto } from './dtos/add-plan-duration.dto';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  // * Add Plan by Owner
  async addPlan(data: AddPlanDto) {
    // * Check if plan already exist
    const existingPlan = await this.prisma.plan.findFirst({
      where: {
        planName: data.planName,
      },
    });

    if (existingPlan) {
      throw new UnauthorizedException('Plan Name already exists');
    }

    // * Add plan to database
    await this.prisma.plan.create({ data });
  }

  // * Add Plan Duration by Owner
  async addPlanDuration(data: AddPlanDurationDto) {
    // * Check if plan exist
    const plan = await this.prisma.plan.findUnique({
      where: { id: data.planId },
    });
    if (!plan) {
      throw new NotFoundException('Plan Not Found');
    }

    // * Check if plan duration already exist
    const existingPlanDuration = await this.prisma.planDuration.findFirst({
      where: {
        AND: [
          { planId: data.planId },
          { durationDays: data.durationDays },
          { price: data.price },
        ],
      },
    });

    if (existingPlanDuration) {
      throw new UnauthorizedException('Plan Duration already exists');
    }

    // * Add plan duration to database
    await this.prisma.planDuration.create({
      data: {
        durationDays: data.durationDays,
        price: data.price,
        plan: { connect: { id: data.planId } },
      },
    });
  }

  // * Get all Plans
  async findAll(page: number, limit: number) {
    const plans = await this.prisma.plan.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: {
        durations: true,
        // subscriptions: true,
      },
    });
    if (plans.length === 0) {
      throw new NotFoundException('No Plan To Show');
    }

    return plans;
  }

  // * Get one Plan
  async findOne(planId: string) {
    const plan = await this.prisma.plan.findUnique({
      where: {
        id: planId,
      },
      include: {
        durations: true,
        // subscriptions: true,
      },
    });
    if (!plan) {
      throw new NotFoundException('No Plan To Show');
    }

    return plan;
  }
}
