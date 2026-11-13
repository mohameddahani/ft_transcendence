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
import { areIntervalsOverlapping, format, parse } from 'date-fns';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { AccessesService } from '@/core/access/access.service';

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

    // * Save New Data
    const updatedWorkingHour = await this.prisma.workingHour.update({
      where: { id: workingHourId },
      data: {
        dayOfWeek: dayOfWeek,
        startTime: startTime,
        endTime: endTime,
        isClosed: isClosed,
      },
    });

    const key = `admin:${adminId}:working-hours:${workingHourId}`;

    // * Delete from Cache Redis
    await this.cache.del(key);

    return updatedWorkingHour;
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

    const workingHours = await this.prisma.workingHour.findMany({
      where: {
        adminId: adminId,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

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
    const key = `admin:${adminId}:working-hours:${workingHourId}`;

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

    const workingHours = await this.prisma.workingHour.findMany({
      where: {
        adminId: adminId,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

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
    const key = `admin:${adminId}:working-hours:${workingHourId}`;

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

  // * Get All Stats of Working Hours (Member)
  async workingHourStatsOfMember(memberId: string) {
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

    const [workingHourStats, specialHoursCount] = await Promise.all([
      // * Count working hours grouped by closed status
      this.prisma.workingHour.groupBy({
        by: ['isClosed'],
        where: {
          adminId,
        },
        _count: {
          _all: true,
        },
      }),

      // * Count all special hour records
      this.prisma.specialHour.count({
        where: {
          adminId,
        },
      }),
    ]);

    let openDaysCount = 0;
    let closedDaysCount = 0;

    for (const stat of workingHourStats) {
      if (stat.isClosed) {
        closedDaysCount = stat._count._all;
      } else {
        openDaysCount = stat._count._all;
      }
    }

    return {
      workingHours: {
        total: openDaysCount + closedDaysCount,
        openDaysCount,
        closedDaysCount,
      },
      specialHours: {
        total: specialHoursCount,
      },
    };
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

    const key = `admin:${adminId}:working-hours:${workingHourId}`;

    // * Delete from Cache Redis
    await this.cache.del(key);
  }

  // * Get All Stats of Working Hours and Special Hours (Admin / Staff)
  async workingHourStats(accessTokenPayload: AccessTokenPayload) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    const [workingHourStats, specialHoursCount] = await Promise.all([
      // * Count working hours grouped by closed status
      this.prisma.workingHour.groupBy({
        by: ['isClosed'],
        where: {
          adminId,
        },
        _count: {
          _all: true,
        },
      }),

      // * Count all special hour records
      this.prisma.specialHour.count({
        where: {
          adminId,
        },
      }),
    ]);

    let openDaysCount = 0;
    let closedDaysCount = 0;

    for (const stat of workingHourStats) {
      if (stat.isClosed) {
        closedDaysCount = stat._count._all;
      } else {
        openDaysCount = stat._count._all;
      }
    }

    return {
      workingHours: {
        total: openDaysCount + closedDaysCount,
        openDaysCount,
        closedDaysCount,
      },
      specialHours: {
        total: specialHoursCount,
      },
    };
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
    let newStartDateTime: Date | null = null;
    let newEndDateTime: Date | null = null;

    if (data.startTime && data.endTime) {
      newStartDateTime = parse(
        `${data.startDate} ${data.startTime}`,
        'yyyy-MM-dd HH:mm',
        new Date(),
      );

      newEndDateTime = parse(
        `${data.endDate} ${data.endTime}`,
        'yyyy-MM-dd HH:mm',
        new Date(),
      );

      // * Start must be strictly before end.
      if (newStartDateTime >= newEndDateTime) {
        throw new BadRequestException(
          'Start date and time must be before end date and time.',
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

      // * At this point both the existing and new closures have start/end times.
      if (!newStartDateTime || !newEndDateTime) {
        continue;
      }

      // * Check if the time ranges overlap
      // * Example:
      // * Existing: 08:00 → 12:00
      // * New:      10:00 → 14:00
      // *
      // * '08:00' < '14:00' && '12:00' > '10:00'
      // * true && true = overlap
      // * Build the existing complete start date/time.
      const existingStartDateTime = parse(
        `${format(existingSpecialHour.startDate, 'yyyy-MM-dd')} ${
          existingSpecialHour.startTime
        }`,
        'yyyy-MM-dd HH:mm',
        new Date(),
      );

      // * Build the existing complete end date/time.
      const existingEndDateTime = parse(
        `${format(existingSpecialHour.endDate, 'yyyy-MM-dd')} ${
          existingSpecialHour.endTime
        }`,
        'yyyy-MM-dd HH:mm',
        new Date(),
      );

      // * Check if the complete date/time ranges overlap.
      const isOverlap = areIntervalsOverlapping(
        {
          start: existingStartDateTime,
          end: existingEndDateTime,
        },
        {
          start: newStartDateTime,
          end: newEndDateTime,
        },
      );

      if (isOverlap) {
        throw new ConflictException(
          'The special hour overlaps with an existing closure.',
        );
      }
    }

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

    // * Validate that both times are provided or both are omitted.
    if (
      (startTimeValue !== null && endTimeValue === null) ||
      (startTimeValue === null && endTimeValue !== null)
    ) {
      throw new BadRequestException(
        'startTime and endTime must be provided together.',
      );
    }

    // * Validate the complete date/time range.
    let newStartDateTime: Date | null = null;
    let newEndDateTime: Date | null = null;

    if (startTimeValue !== null && endTimeValue !== null) {
      newStartDateTime = parse(
        `${startDateValue} ${startTimeValue}`,
        'yyyy-MM-dd HH:mm',
        new Date(),
      );

      newEndDateTime = parse(
        `${endDateValue} ${endTimeValue}`,
        'yyyy-MM-dd HH:mm',
        new Date(),
      );

      // * Start must be strictly before end.
      if (newStartDateTime >= newEndDateTime) {
        throw new BadRequestException(
          'Start date and time must be before end date and time.',
        );
      }
    }

    // * Convert date strings into JavaScript Date objects
    const startDate = this.parseDateOnly(startDateValue);
    const endDate = this.parseDateOnly(endDateValue);

    // * Find other special hours whose date range overlaps the updated range.
    const existingSpecialHours = await this.prisma.specialHour.findMany({
      where: {
        id: {
          not: specialHourId,
        },
        adminId,
        startDate: {
          lte: endDate,
        },
        endDate: {
          gte: startDate,
        },
      },
    });

    for (const existingHour of existingSpecialHours) {
      // * Existing special hour closes the entire date range.
      if (existingHour.startTime === null || existingHour.endTime === null) {
        throw new ConflictException(
          'The gym is already closed during this date range.',
        );
      }

      // * Updated special hour closes the entire date range.
      if (startTimeValue === null && endTimeValue === null) {
        throw new ConflictException(
          'The selected date range already contains a special closure.',
        );
      }

      // * Both closures have start/end times at this point.
      if (!newStartDateTime || !newEndDateTime) {
        continue;
      }

      // * Build the existing complete start date/time.
      const existingStartDateTime = parse(
        `${format(existingHour.startDate, 'yyyy-MM-dd')} ${
          existingHour.startTime
        }`,
        'yyyy-MM-dd HH:mm',
        new Date(),
      );

      // * Build the existing complete end date/time.
      const existingEndDateTime = parse(
        `${format(existingHour.endDate, 'yyyy-MM-dd')} ${existingHour.endTime}`,
        'yyyy-MM-dd HH:mm',
        new Date(),
      );

      // * Check if the complete date/time ranges overlap.
      const isOverlap = areIntervalsOverlapping(
        {
          start: existingStartDateTime,
          end: existingEndDateTime,
        },
        {
          start: newStartDateTime,
          end: newEndDateTime,
        },
      );

      if (isOverlap) {
        throw new ConflictException(
          'The special hour overlaps with an existing closure.',
        );
      }
    }

    // * Update Special Hour
    const updatedSpecialHour = await this.prisma.specialHour.update({
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

    const key = `admin:${adminId}:special-hours:${specialHourId}`;

    // * Delete from Cache Redis
    await this.cache.del(key);

    return updatedSpecialHour;
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

    const specialHours = await this.prisma.specialHour.findMany({
      where: {
        adminId: adminId,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

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
    const key = `admin:${adminId}:special-hours:${specialHourId}`;

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

    const specialHours = await this.prisma.specialHour.findMany({
      where: {
        adminId: adminId,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

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
    const key = `admin:${adminId}:special-hours:${specialHourId}`;

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

    const key = `admin:${adminId}:special-hours:${specialHourId}`;

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
