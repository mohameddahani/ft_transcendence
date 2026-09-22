import { AccessesService } from '@/core/services/access.service';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddWorkingHourDto } from './dtos/add-working-hour.dto';
import { UpdateWorkingHourDto } from './dtos/update-working-hour.dto';
import { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { AddSpecialHourDto } from './dtos/add-special-hour.dto';
import { UpdateSpecialHourDto } from './dtos/update-special-hour.dto';
import { format, parse } from 'date-fns';

@Injectable()
export class WorkingHoursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessesService: AccessesService,
  ) {}

  /* 
  =========================
  ! Working Hours
  =========================
  */

  // * Add Working Hours By (Admin)
  async addWorkingHourByDay(adminId: string, data: AddWorkingHourDto) {
    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    // * Check that start time is before end time
    if (data.startTime >= data.endTime) {
      throw new ForbiddenException('Start time must be earlier than end time.');
    }

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

    // * Get the final values after applying the update
    const dayOfWeek = data.dayOfWeek ?? workingHour.dayOfWeek;

    const startTime =
      data.startTime !== undefined ? data.startTime : workingHour.startTime;

    const endTime =
      data.endTime !== undefined ? data.endTime : workingHour.endTime;

    const isClosed = data.isClosed ?? workingHour.isClosed;

    // * Validate that start time is before end time
    if (startTime >= endTime) {
      throw new BadRequestException(
        'Start time must be earlier than end time.',
      );
    }

    // * Check if day of week data duplicate
    const existingData = await this.prisma.workingHour.findFirst({
      where: {
        id: {
          not: workingHourId,
        },
        adminId: adminId,
        dayOfWeek: dayOfWeek,
      },
    });

    if (existingData) {
      throw new ConflictException('Day Of Week already exists');
    }

    // * Save New Data
    await this.prisma.workingHour.update({
      where: { id: workingHourId },
      data: {
        dayOfWeek: dayOfWeek,
        startTime: startTime,
        endTime: endTime,
        isClosed: isClosed,
      },
    });
  }

  // * Get All Working Hours By (Admin / Staff)
  async findAllWorkingHours(
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
  async findOneWorkingHour(
    accessTokenPayload: AccessTokenPayload,
    workingHourId: string,
  ) {
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

  // * Get All Working Hours By (Member)
  async findAllWorkingHoursByMember(
    memberId: string,
    page: number,
    limit: number,
  ) {
    // * Get Admin id
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

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

  // * Get One Working Hour By (Member)
  async findOneWorkingHourByMember(memberId: string, workingHourId: string) {
    // * Get Admin id
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

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
  async deleteOneWorkingHour(adminId: string, workingHourId: string) {
    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    // * Check if the working hour exists and belongs to the admin
    const workingHour = await this.prisma.workingHour.findFirst({
      where: {
        id: workingHourId,
        adminId,
      },
    });

    if (!workingHour) {
      throw new NotFoundException('Working hour not found.');
    }

    await this.prisma.workingHour.delete({
      where: {
        id: workingHourId,
      },
    });
  }

  /* 
  =========================
  ! Special Hours
  =========================
  */

  // * Add Special Hours By (Admin)
  async addSpecialHour(adminId: string, data: AddSpecialHourDto) {
    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    // * Check that the start date is not in the past
    if (data.startDate < format(new Date(), 'yyyy-MM-dd')) {
      throw new BadRequestException('Start date cannot be in the past.');
    }

    // * Check that start date is before end date
    if (data.startDate > data.endDate) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    // * Validate that both times are provided or both are omitted
    if (
      (data.startTime && !data.endTime) ||
      (!data.startTime && data.endTime)
    ) {
      throw new BadRequestException(
        'startTime and endTime must be provided together.',
      );
    }

    // * Validate the complete date/time range
    if (data.startTime && data.endTime) {
      const start = new Date(`${data.startDate}T${data.startTime}`);
      const end = new Date(`${data.endDate}T${data.endTime}`);

      if (start > end) {
        throw new BadRequestException(
          'Start date and time cannot be after end date and time.',
        );
      }
    }

    // * Check the day is already added with same time
    // Convert date strings into JavaScript Date objects.
    // The database field uses @db.Date, so only the calendar date is stored.
    // * Convert date strings into local calendar dates
    const startDate = this.parseDateOnly(data.startDate);
    const endDate = this.parseDateOnly(data.endDate);

    const existingSpecialHours = await this.prisma.specialHour.findMany({
      where: {
        adminId: adminId,

        // * Existing range overlaps the new date range
        startDate: {
          lte: endDate,
        },
        endDate: {
          gte: startDate,
        },
      },
    });

    for (const existingSpecialHour of existingSpecialHours) {
      // * Existing special hour closes the entire day
      if (
        existingSpecialHour.startTime === null ||
        existingSpecialHour.endTime === null
      ) {
        throw new ConflictException(
          'The gym is already closed during this date range.',
        );
      }

      // * New special hour is also a full-day closure
      if (!data.startTime && !data.endTime) {
        throw new ConflictException(
          'The selected date range already contains a special closure.',
        );
      }

      // * Check if the time ranges overlap
      // * Example:
      // * Existing: 08:00 → 12:00
      // * New:      10:00 → 14:00
      // *
      // * '08:00' < '14:00' && '12:00' > '10:00'
      // * true && true = overlap
      const timeOverlap =
        existingSpecialHour.startTime < data.endTime &&
        existingSpecialHour.endTime > data.startTime;

      if (timeOverlap) {
        throw new ConflictException(
          'The special hour overlaps with an existing closure.',
        );
      }
    }

    // * Add Working Hour
    await this.prisma.specialHour.create({
      data: {
        admin: { connect: { id: adminId } },
        startDate: startDate,
        endDate: endDate,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });
  }

  // * Update Special Hours By (Admin)
  async updateSpecialHour(
    adminId: string,
    specialHourId: string,
    data: UpdateSpecialHourDto,
  ) {
    // * Check if admin has an active subscription
    await this.accessesService.validateActiveSubscription(adminId);

    // * Check if the special hour exists and belongs to the admin
    const existingSpecialHour = await this.prisma.specialHour.findFirst({
      where: {
        id: specialHourId,
        adminId: adminId,
      },
    });

    if (!existingSpecialHour) {
      throw new NotFoundException('Special hour not found.');
    }

    // * Convert existing dates into YYYY-MM-DD strings
    const existingStartDate = format(
      existingSpecialHour.startDate,
      'yyyy-MM-dd',
    );

    const existingEndDate = format(existingSpecialHour.endDate, 'yyyy-MM-dd');

    // * Get the final dates after applying the update
    const startDateValue = data.startDate ?? existingStartDate;
    const endDateValue = data.endDate ?? existingEndDate;

    // * Get the final times after applying the update
    const startTimeValue =
      data.startTime !== undefined
        ? data.startTime
        : existingSpecialHour.startTime;

    const endTimeValue =
      data.endTime !== undefined ? data.endTime : existingSpecialHour.endTime;

    // * Get today's date
    const today = format(new Date(), 'yyyy-MM-dd');

    // * Check that the start date is not in the past
    if (startDateValue < today && data.startDate !== undefined) {
      throw new BadRequestException('Start date cannot be in the past.');
    }

    // * Check that the start date is before or equal to the end date
    if (startDateValue > endDateValue) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    // * Validate that both times are provided or both are omitted
    if (
      (startTimeValue && !endTimeValue) ||
      (!startTimeValue && endTimeValue)
    ) {
      throw new BadRequestException(
        'startTime and endTime must be provided together.',
      );
    }

    // * Validate the complete date/time range
    if (startTimeValue && endTimeValue) {
      const start = new Date(`${startDateValue}T${startTimeValue}`);
      const end = new Date(`${endDateValue}T${endTimeValue}`);

      if (start > end) {
        throw new BadRequestException(
          'Start date and time cannot be after end date and time.',
        );
      }
    }

    // * Convert date strings into JavaScript Date objects
    const startDate = this.parseDateOnly(startDateValue);
    const endDate = this.parseDateOnly(endDateValue);

    // * Check if another special hour with the same dates and times exists
    // * Exclude the current record from the search
    const duplicateSpecialHour = await this.prisma.specialHour.findFirst({
      where: {
        id: {
          not: specialHourId,
        },
        adminId: adminId,
        startDate: startDate,
        endDate: endDate,
        startTime: startTimeValue ?? null,
        endTime: endTimeValue ?? null,
      },
    });

    if (duplicateSpecialHour) {
      throw new ConflictException('This special hour already exists.');
    }

    // * Update Special Hour
    return this.prisma.specialHour.update({
      where: {
        id: specialHourId,
      },
      data: {
        startDate: startDate,
        endDate: endDate,
        startTime: startTimeValue,
        endTime: endTimeValue,
      },
    });
  }

  // * Get All Special Hours (Admin)
  async findAllSpecialHours(
    accessTokenPayload: AccessTokenPayload,
    page: number,
    limit: number,
  ) {
    // * Get Admin id
    const adminId =
      await this.accessesService.resolveAdminId(accessTokenPayload);

    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    const specialHours = await this.prisma.specialHour.findMany({
      where: {
        adminId: adminId,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    if (specialHours.length === 0) {
      throw new NotFoundException('There is No Special Hours To show');
    }

    return specialHours;
  }

  // * Get One Special Hour (Admin)
  async findOneSpecialHour(
    accessTokenPayload: AccessTokenPayload,
    specialHourId: string,
  ) {
    // * Get Admin id
    const adminId =
      await this.accessesService.resolveAdminId(accessTokenPayload);

    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    const specialHour = await this.prisma.specialHour.findFirst({
      where: {
        id: specialHourId,
        adminId: adminId,
      },
    });
    if (!specialHour) {
      throw new NotFoundException('Special Hour Not Found');
    }

    return specialHour;
  }

  // * Delete One Special Hour By (Admin)
  async deleteOneSpecialHour(adminId: string, specialHourId: string) {
    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    // * Check if the working hour exists and belongs to the admin
    const specialHour = await this.prisma.specialHour.findFirst({
      where: {
        id: specialHourId,
        adminId,
      },
    });

    if (!specialHour) {
      throw new NotFoundException('Special hour not found.');
    }

    await this.prisma.specialHour.delete({
      where: {
        id: specialHourId,
      },
    });
  }

  // * Convert a YYYY-MM-DD string into a UTC Date.
  // * This is used for PostgreSQL DATE fields.
  // * It prevents the local timezone from shifting the calendar date.
  private parseDateOnly(value: string) {
    // * Change String To Date
    const parsed = parse(value, 'yyyy-MM-dd', new Date());

    // * Remove UTC
    return new Date(
      Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
    );
  }
}
