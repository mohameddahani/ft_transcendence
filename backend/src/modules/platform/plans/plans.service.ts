import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AddPlanDto } from './dtos/add-plan.dto';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { AddPlanDurationDto } from './dtos/add-plan-duration.dto';
import { UpdatePlanDto } from './dtos/update-plan.dto';
import { UpdatePlanDurationDto } from './dtos/update-plan-duration.dto';
import { SubscriptionStatus } from '@/generated/prisma/enums';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  // * Add Plan by Owner
  async addPlan(data: AddPlanDto) {
    // * Check if plan already exist
    const existingPlan = await this.prisma.plan.findUnique({
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
    await this.findOne(data.planId);

    // * Check if plan duration is duplicate
    await this.checkIfDurationIsDuplicateInPlan(
      data.planId,
      data.durationDays,
      data.price,
    );

    // * Add plan duration to database
    await this.prisma.planDuration.create({
      data: {
        durationDays: data.durationDays,
        price: data.price,
        plan: { connect: { id: data.planId } },
      },
    });
  }

  // * Update a Plan
  async update(id: string, data: UpdatePlanDto) {
    // * Check if this plan already exist
    const plan = await this.findOne(id);

    // * Check if status of plan will be updated
    if (data.isActive !== undefined) {
      if (!data.isActive) {
        // * Check if any admin use this plan before desactive it
        const NumAdmins = await this.prisma.subscription.count({
          where: {
            planId: plan.id,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
          },
        });
        if (NumAdmins > 0) {
          throw new BadRequestException(
            `The Are ${NumAdmins} Admin Use This Plan`,
          );
        }
      }
    }

    // * Check data if already exist in DB
    if (data.planName !== undefined) {
      const existingData = await this.prisma.plan.findFirst({
        where: {
          id: {
            not: id,
          },
          planName: data.planName,
        },
      });
      if (existingData) {
        // * 409 = duplicate data
        throw new ConflictException('Plan Name already exists');
      }
    }

    // * Update data
    await this.prisma.plan.update({
      where: {
        id: id,
      },
      data,
    });
  }

  // * Update a Plan Duration
  async updatePlanDuration(id: string, data: UpdatePlanDurationDto) {
    // * Check if this plan duration already exist
    const duration = await this.prisma.planDuration.findUnique({
      where: { id: id },
    });
    if (!duration) {
      throw new NotFoundException('Duration Plan Not Found!');
    }

    // * Check duration if already exist in this plan
    await this.checkIfDurationAlreadyExistInPlan(duration.id, data.planId);

    // * check if Duration is Duplicate in Plan
    if (data.durationDays !== undefined && data.price !== undefined) {
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
        throw new UnauthorizedException('Plan Duration is Duplicate');
      }
    } else if (data.price !== undefined) {
      const existingPlanDuration = await this.prisma.planDuration.findFirst({
        where: {
          AND: [
            { planId: data.planId },
            { durationDays: duration.durationDays },
            { price: data.price },
          ],
        },
      });

      if (existingPlanDuration) {
        throw new UnauthorizedException('Plan Duration is Duplicate');
      }
    } else if (data.durationDays !== undefined) {
      const existingPlanDuration = await this.prisma.planDuration.findFirst({
        where: {
          AND: [
            { planId: data.planId },
            { durationDays: data.durationDays },
            { price: duration.price },
          ],
        },
      });

      if (existingPlanDuration) {
        throw new UnauthorizedException('Plan Duration is Duplicate');
      }
    }

    // * Update data
    await this.prisma.planDuration.update({
      where: {
        id: id,
      },
      data,
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
      throw new NotFoundException('Plan Not Found!');
    }

    return plan;
  }

  // ! Private
  // * check if Duration is Duplicate in Plan
  private async checkIfDurationIsDuplicateInPlan(
    planId: string,
    durationDays: number,
    price: number,
  ) {
    // * Check if plan duration already exist
    const existingPlanDuration = await this.prisma.planDuration.findFirst({
      where: {
        AND: [
          { planId: planId },
          { durationDays: durationDays },
          { price: price },
        ],
      },
    });

    if (existingPlanDuration) {
      throw new UnauthorizedException('Plan Duration is Duplicate');
    }
  }

  // * check if Duration is exist in Plan
  private async checkIfDurationAlreadyExistInPlan(
    durationId: string,
    planId: string,
  ) {
    // * Check if plan duration already exist
    const existingPlanDuration = await this.prisma.planDuration.findFirst({
      where: {
        planId: planId,
        id: durationId,
      },
    });

    if (!existingPlanDuration) {
      throw new UnauthorizedException(
        'Plan Duration is Not exists in This Plan',
      );
    }
  }
}
