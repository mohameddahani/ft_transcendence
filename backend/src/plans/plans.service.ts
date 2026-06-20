import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AddPlanDto } from './dtos/add-plan.dto';
import { PrismaService } from '@/prisma/prisma.service';

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
      throw new UnauthorizedException('Username already exists');
    }

    // * Add plan to database
    await this.prisma.plan.create({ data });
  }
}
