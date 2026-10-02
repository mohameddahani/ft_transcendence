import { AccessesService } from '@/core/services/access.service';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AddWorkingHourDto } from './dtos/add-working-hour.dto';
import { UpdateWorkingHourDto } from './dtos/update-working-hour.dto';
import { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { AddSpecialHourDto } from './dtos/add-special-hour.dto';
import { UpdateSpecialHourDto } from './dtos/update-special-hour.dto';
import { format, parse } from 'date-fns';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class WorkingHoursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessesService: AccessesService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /* 
  =========================
  ! Working Hours
  =========================
  */

  // * Add Working Hours By (Admin)
  async addWorkingHourByDay(adminId: string, data: AddWorkingHourDto) {
    // * Check that the admin account, subscription, and associated plan are active.
    await this.accessesService.validateAdminAccountAndSubscription(adminId);

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

    const key = `admin:${adminId}:working-hours`;

    // * Delete from Cache Redis
    await this.cache.del(key);

    // * Add Working Hour
    return await this.prisma.workingHour.create({
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
    // * Check that the admin account, subscription, and associated plan are active.
    await this.accessesService.validateAdminAccountAndSubscription(adminId);

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

    const key = `admin:${adminId}:working-hours`;

    // * Delete from Cache Redis
    await this.cache.del(key);

    // * Save New Data
    return await this.prisma.workingHour.update({
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
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    // * Check if Data is already store in caching
    const key = `admin:${adminId}:working-hours:page:${page}:limit:${limit}`;

    // * Get data from redis server
    const cachedWorkingHours = await this.cache.get(key);

    // * Check if redis store Data
    if (cachedWorkingHours) {
      return cachedWorkingHours;
    }

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

    // * Set Data in Redis
    await this.cache.set(key, workingHours, 300_000); // * ttl: 5min

    return workingHours;
  }

  // * Get One Working Hour By (Admin / Staff)
  async findOneWorkingHour(
    accessTokenPayload: AccessTokenPayload,
    workingHourId: string,
  ) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    // * Check if Data is already store in caching
    const key = `admin:${adminId}:working-hours`;

    // * Get data from redis server
    const cachedWorkingHour = await this.cache.get(key);

    // * Check if redis store Data
    if (cachedWorkingHour) {
      return cachedWorkingHour;
    }

    const workingHour = await this.prisma.workingHour.findFirst({
      where: {
        id: workingHourId,
        adminId: adminId,
      },
    });
    if (!workingHour) {
      throw new NotFoundException('Working Hour Not Found');
    }

    // * Set Data in Redis
    await this.cache.set(key, workingHour, 300_000); // * ttl: 5min

    return workingHour;
  }

  // * Get All Working Hours By (Member)
  async findAllWorkingHoursByMember(
    memberId: string,
    page: number,
    limit: number,
  ) {
    // * Get Admin Id from member
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

    // * Check that the admin account, subscription, and plan are active.
    await this.accessesService.validateAdminAccountAndSubscription(adminId);

    // * Check that the member account and membership are active.
    await this.accessesService.validateMemberAccountAndMembership(
      memberId,
      adminId,
    );

    // * Check if Data is already store in caching
    const key = `admin:${adminId}:working-hours:page:${page}:limit:${limit}`;

    // * Get data from redis server
    const cachedWorkingHours = await this.cache.get(key);

    // * Check if redis store Data
    if (cachedWorkingHours) {
      return cachedWorkingHours;
    }

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

    // * Set Data in Redis
    await this.cache.set(key, workingHours, 300_000); // * ttl: 5min

    return workingHours;
  }

  // * Get One Working Hour By (Member)
  async findOneWorkingHourByMember(memberId: string, workingHourId: string) {
    // * Get Admin Id from member
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

    // * Check that the admin account, subscription, and plan are active.
    await this.accessesService.validateAdminAccountAndSubscription(adminId);

    // * Check that the member account and membership are active.
    await this.accessesService.validateMemberAccountAndMembership(
      memberId,
      adminId,
    );

    // * Check if Data is already store in caching
    const key = `admin:${adminId}:working-hours`;

    // * Get data from redis server
    const cachedWorkingHour = await this.cache.get(key);

    // * Check if redis store Data
    if (cachedWorkingHour) {
      return cachedWorkingHour;
    }

    const workingHour = await this.prisma.workingHour.findFirst({
      where: {
        id: workingHourId,
        adminId: adminId,
      },
    });
    if (!workingHour) {
      throw new NotFoundException('Working Hour Not Found');
    }

    // * Set Data in Redis
    await this.cache.set(key, workingHour, 300_000); // * ttl: 5min

    return workingHour;
  }

  // * Delete One Working Hour By (Admin)
  async deleteOneWorkingHour(adminId: string, workingHourId: string) {
    // * Check that the admin account, subscription, and associated plan are active.
    await this.accessesService.validateAdminAccountAndSubscription(adminId);

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

    const key = `admin:${adminId}:working-hours`;

    // * Delete from Cache Redis
    await this.cache.del(key);
  }

  /* 
  =========================
  ! Special Hours
  =========================
  */

  // * Add Special Hours By (Admin)
  async addSpecialHour(adminId: string, data: AddSpecialHourDto) {
    // * Check that the admin account, subscription, and associated plan are active.
    await this.accessesService.validateAdminAccountAndSubscription(adminId);

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

    const key = `admin:${adminId}:special-hours`;

    // * Delete from Cache Redis
    await this.cache.del(key);

    // * Add Working Hour
    return await this.prisma.specialHour.create({
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
    await this.accessesService.validateAdminAccountAndSubscription(adminId);

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

    const key = `admin:${adminId}:special-hours`;

    // * Delete from Cache Redis
    await this.cache.del(key);

    // * Update Special Hour
    return await this.prisma.specialHour.update({
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

  // * Get All Special Hours (Admin / Staff)
  async findAllSpecialHours(
    accessTokenPayload: AccessTokenPayload,
    page: number,
    limit: number,
  ) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    // * Check if Data is already store in caching
    const key = `admin:${adminId}:special-hours:page:${page}:limit:${limit}`;

    // * Get data from redis server
    const cachedSpecialHours = await this.cache.get(key);

    // * Check if redis store Data
    if (cachedSpecialHours) {
      console.log(cachedSpecialHours === true);
      return cachedSpecialHours;
    }

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

    // * Set Data in Redis
    await this.cache.set(key, specialHours, 300_000); // * ttl: 5min

    return specialHours;
  }

  // * Get One Special Hour (Admin / Staff)
  async findOneSpecialHour(
    accessTokenPayload: AccessTokenPayload,
    specialHourId: string,
  ) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    // * Check if Data is already store in caching
    const key = `admin:${adminId}:special-hours`;

    // * Get data from redis server
    const cachedSpecialHour = await this.cache.get(key);

    // * Check if redis store Data
    if (cachedSpecialHour) {
      return cachedSpecialHour;
    }

    const specialHour = await this.prisma.specialHour.findFirst({
      where: {
        id: specialHourId,
        adminId: adminId,
      },
    });
    if (!specialHour) {
      throw new NotFoundException('Special Hour Not Found');
    }

    // * Set Data in Redis
    await this.cache.set(key, specialHour, 300_000); // * ttl: 5min

    return specialHour;
  }

  // * Get All Special Hours (Member)
  async findAllSpecialHoursByMember(
    memberId: string,
    page: number,
    limit: number,
  ) {
    // * Get Admin Id from member
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

    // * Check that the admin account, subscription, and plan are active.
    await this.accessesService.validateAdminAccountAndSubscription(adminId);

    // * Check that the member account and membership are active.
    await this.accessesService.validateMemberAccountAndMembership(
      memberId,
      adminId,
    );

    // * Check if Data is already store in caching
    const key = `admin:${adminId}:special-hours:page:${page}:limit:${limit}`;

    // * Get data from redis server
    const cachedSpecialgHours = await this.cache.get(key);

    // * Check if redis store Data
    if (cachedSpecialgHours) {
      return cachedSpecialgHours;
    }

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

    // * Set Data in Redis
    await this.cache.set(key, specialHours, 300_000); // * ttl: 5min

    return specialHours;
  }

  // * Get One Special Hour (Member)
  async findOneSpecialHourByMember(memberId: string, specialHourId: string) {
    // * Get Admin Id from member
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

    // * Check that the admin account, subscription, and plan are active.
    await this.accessesService.validateAdminAccountAndSubscription(adminId);

    // * Check that the member account and membership are active.
    await this.accessesService.validateMemberAccountAndMembership(
      memberId,
      adminId,
    );

    // * Check if Data is already store in caching
    const key = `admin:${adminId}:special-hours`;

    // * Get data from redis server
    const cachedSpecialgHour = await this.cache.get(key);

    // * Check if redis store Data
    if (cachedSpecialgHour) {
      return cachedSpecialgHour;
    }

    const specialHour = await this.prisma.specialHour.findFirst({
      where: {
        id: specialHourId,
        adminId: adminId,
      },
    });
    if (!specialHour) {
      throw new NotFoundException('Special Hour Not Found');
    }

    // * Set Data in Redis
    await this.cache.set(key, specialHour, 300_000); // * ttl: 5min

    return specialHour;
  }

  // * Delete One Special Hour By (Admin)
  async deleteOneSpecialHour(adminId: string, specialHourId: string) {
    // * Check that the admin account, subscription, and associated plan are active.
    await this.accessesService.validateAdminAccountAndSubscription(adminId);

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

    const key = `admin:${adminId}:special-hours`;

    // * Delete from Cache Redis
    await this.cache.del(key);
  }

  // ! Private
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
