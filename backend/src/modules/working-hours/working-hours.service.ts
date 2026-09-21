import { AccessesService } from '@/core/services/access.service';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddWorkingHourDto } from './dtos/add-working-hour.dto';
import { UpdateWorkingHourDto } from './dtos/update-working-hour.dto';
import { AccessTokenPayload } from '@/core/types/jwt-payload.type';

@Injectable()
export class WorkingHoursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessesService: AccessesService,
  ) {}

  // * Add Working Hours By (Admin)
  async addWorkingHourByDay(adminId: string, data: AddWorkingHourDto) {
    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    // * Check the day is already added
    const dayAlreadyExist = await this.prisma.workingHour.findUnique({
      where: {
        adminId_dayOfWeek: {
          adminId: adminId,
          dayOfWeek: data.dayOfWeek,
        },
      },
    });

    if (dayAlreadyExist) {
      throw new ForbiddenException('This Day Already Added');
    }

    // * Check that start time is before end time
    if (data.startTime >= data.endTime) {
      throw new ForbiddenException('Start time must be earlier than end time.');
    }

    // * Add Working Hour
    await this.prisma.workingHour.create({
      data: {
        admin: { connect: { id: adminId } },
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isClosed: data.isClosed,
      },
    });
  }

  // * Update Working Hours By (Admin)
  async updateWorkingHourByDay(
    adminId: string,
    workingHourId: string,
    data: UpdateWorkingHourDto,
  ) {
    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    // * Check this Working Hour is exist
    const workingHour = await this.prisma.workingHour.findFirst({
      where: {
        id: workingHourId,
        adminId: adminId,
      },
    });
    if (!workingHour) {
      throw new NotFoundException('Working Hour Not Found');
    }

    // * Check that start time is before end time
    if (
      data.startTime !== undefined &&
      data.endTime !== undefined &&
      data.startTime >= data.endTime
    ) {
      throw new ForbiddenException('Start time must be earlier than end time.');
    }

    // * Check if day of week data duplicate
    const existingData = await this.prisma.workingHour.findFirst({
      where: {
        id: {
          not: workingHourId,
        },
        adminId: adminId,
        dayOfWeek: data.dayOfWeek,
      },
    });

    if (existingData) {
      throw new ConflictException('Day Of Week already exists');
    }

    // * Save New Data
    await this.prisma.workingHour.update({
      where: { id: workingHourId, adminId: adminId },
      data: {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isClosed: data.isClosed,
      },
    });
  }

  // * Get All Working Hours By (Admin / Staff)
  async findAll(
    accessTokenPayload: AccessTokenPayload,
    page: number,
    limit: number,
  ) {
    // * Get Admin id
    const adminId =
      await this.accessesService.resolveAdminId(accessTokenPayload);

    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    const workingHours = await this.prisma.workingHour.findMany({
      where: {
        adminId: adminId,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    if (workingHours.length === 0) {
      throw new NotFoundException('There is No Working Hours To show');
    }

    return workingHours;
  }

  // * Get One Working Hour By (Admin / Staff)
  async findOne(accessTokenPayload: AccessTokenPayload, workingHourId: string) {
    // * Get Admin id
    const adminId =
      await this.accessesService.resolveAdminId(accessTokenPayload);

    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    const workingHour = await this.prisma.workingHour.findFirst({
      where: {
        id: workingHourId,
        adminId: adminId,
      },
    });
    if (!workingHour) {
      throw new NotFoundException('Working Hour Not Found');
    }

    return workingHour;
  }

  // * Delete One Working Hour By (Admin)
  async delete(adminId: string, workingHourId: string) {
    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    await this.prisma.workingHour.delete({
      where: {
        id: workingHourId,
        adminId: adminId,
      },
    });
  }
}
