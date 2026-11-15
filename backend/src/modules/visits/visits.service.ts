import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  addMinutes,
  endOfDay,
  endOfWeek,
  format,
  getISODay,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { generateActionToken } from '@/core/utils/generate-action-token';
import { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { CreateVisitDto } from './dtos/create-visit.dto';
import { VisitStatus } from '@/generated/prisma/enums';
import {
  publicMemberSelect,
  publicUserSelect,
} from '@/core/types/safe-selects.type';
import { VISIT_EXPIRATION_MINUTES } from '@/core/constants/visit.constants';
import { AccessesService } from '@/core/access/access.service';

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessesService: AccessesService,
  ) {}

  // * Create A Visit
  async createVisit(memberId: string, data: CreateVisitDto) {
    // * Check if the visit date and time is in the future
    const now = new Date();

    if (data.visitDateAndTime <= now) {
      throw new ForbiddenException(
        'The visit date and time must be in the future.',
      );
    }

    // * Get Admin Id from member
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

    // * Check that the admin account, subscription, and plan are active.
    await this.accessesService.validateAdminAccountAndSubscription(
      adminId,
      data.visitDateAndTime,
    );

    // * Check that the member account and membership are active.
    const membership =
      await this.accessesService.validateMemberAccountAndMembership(
        memberId,
        adminId,
        data.visitDateAndTime,
      );

    // * Check Special Hours
    const dateOfVisit = startOfDay(data.visitDateAndTime);
    const visitTime = format(data.visitDateAndTime, 'HH:mm');
    const specialHours = await this.prisma.specialHour.findMany({
      where: {
        adminId: adminId,
        startDate: { lte: dateOfVisit },
        endDate: { gte: dateOfVisit },
      },
    });

    // That's why I use findMany() instead of findFirst():
    // findMany() allows us to check all special closure periods
    // that apply to the requested date.

    // Example: The gym has two closure periods:
    //
    // 1. SpecialHour #2: 18:00 to 20:00
    //    Requested time: 15:00. not inside (false).
    //
    // 2. SpecialHour #1: 14:00 to 16:00
    //    Requested time: 15:00. inside (true).
    //
    // 3. Throw an exception because the requested time
    //    falls within a closure period.
    //
    // Result: Visit rejected.
    for (const specialHour of specialHours) {
      // * Closed for the whole day
      if (!specialHour.startTime || !specialHour.endTime) {
        throw new ForbiddenException('The gym is closed on this date.');
      }

      // * Closed during the special period
      const startTime = specialHour.startTime;
      const endTime = specialHour.endTime;

      let isClosed = false;

      if (startTime < endTime) {
        // * Normal period: 14:00 to 18:00
        // 15:00 >= 14:00 true
        // &&
        // 15:00 <= 18:00 true
        // Result: CLOSED

        isClosed = visitTime >= startTime && visitTime <= endTime;
      } else {
        // * Overnight period: 22:00 to 02:00
        // 01:00 >= 23:00 false
        // ||
        // 01:00 <= 02:00 true
        // Result: CLOSED

        isClosed = visitTime >= startTime || visitTime <= endTime;
      }

      if (isClosed) {
        throw new ForbiddenException('The gym is closed at this time.');
      }
    }

    // * Check the date and time is available
    const dayOfWeek = getISODay(data.visitDateAndTime);
    const workingHour = await this.prisma.workingHour.findFirst({
      where: {
        adminId: adminId,
        dayOfWeek: dayOfWeek,
        startTime: { lte: visitTime },
        endTime: { gte: visitTime },
        isClosed: false,
      },
    });

    if (!workingHour) {
      throw new ForbiddenException(
        'The gym is closed or unavailable at this time.',
      );
    }

    const rawToken = await this.prisma.$transaction(async (tx) => {
      // * Block this member for Update
      await tx.$queryRaw`
        SELECT "id" FROM "members" 
        WHERE "id" = ${memberId}
        FOR UPDATE
        `;

      // * Get Start of Day and End
      const startOfToday = startOfDay(data.visitDateAndTime);
      const endOfToday = endOfDay(data.visitDateAndTime);

      // * Check if member already has a visit on the chosen day
      const alreadyVisited = await tx.visit.findFirst({
        where: {
          adminId: adminId,
          memberId: memberId,
          visitDateAndTime: {
            gte: startOfToday,
            lte: endOfToday,
          },
          visitStatus: {
            not: VisitStatus.CANCELLED,
          },
        },
      });

      if (alreadyVisited) {
        throw new ForbiddenException(
          'You already have a visit scheduled for this day.',
        );
      }

      // * Calculate choosen week
      // Monday = first day of the week
      const monday = startOfWeek(data.visitDateAndTime, {
        weekStartsOn: 1,
      });

      // Sunday = last day of the week
      const sunday = endOfWeek(data.visitDateAndTime, {
        weekStartsOn: 1,
      });

      // * Check weekly visit limit
      const visitCount = await tx.visit.count({
        where: {
          adminId: adminId,
          memberId: memberId,
          visitDateAndTime: {
            gte: monday,
            lte: sunday,
          },
          visitStatus: { not: VisitStatus.CANCELLED },
        },
      });

      if (visitCount >= membership.membershipPlan.weeklyVisitLimit) {
        throw new ForbiddenException(
          'Weekly visit limit has been reached for this membership.',
        );
      }

      const attendanceCount = await tx.attendance.count({
        where: {
          adminId: adminId,
          memberId: memberId,
          checkedInAt: {
            gte: monday,
            lte: sunday,
          },
        },
      });

      if (attendanceCount >= membership.membershipPlan.weeklyVisitLimit) {
        throw new ForbiddenException(
          'Weekly attendance limit has been reached for this membership.',
        );
      }

      // * Create Visit
      const { rawToken, tokenHash } = generateActionToken();

      await tx.visit.create({
        data: {
          admin: { connect: { id: adminId } },
          member: { connect: { id: memberId } },
          membership: { connect: { id: membership.id } },
          visitDateAndTime: data.visitDateAndTime,
          qrTokenHash: tokenHash,
          visitDateAndTimeExpiresAt: addMinutes(
            data.visitDateAndTime,
            VISIT_EXPIRATION_MINUTES,
          ), // * Add 30 min
        },
      });

      return rawToken;
    });

    return { rawToken: rawToken };
  }

  // * Cancel A Visit
  async cancelVisit(memberId: string, visitId: string) {
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

    // * Check the visit is already exist
    const existVisit = await this.prisma.visit.findFirst({
      where: {
        id: visitId,
        adminId: adminId,
        memberId: memberId,
      },
    });

    if (!existVisit) {
      throw new NotFoundException('Visit Not Found.');
    }

    // * Check if the visit can be cancelled
    if (existVisit.visitStatus !== VisitStatus.READY) {
      throw new BadRequestException('Only a ready visit can be cancelled.');
    }

    // * Cancel the visit
    const { count } = await this.prisma.visit.updateMany({
      where: {
        id: visitId,
      },
      data: {
        visitStatus: VisitStatus.CANCELLED,
      },
    });

    if (count !== 1) {
      throw new ConflictException(
        'Visit can no longer be cancelled because its status has already changed.',
      );
    }
  }

  // * Get all visits
  async findAllVisitsToday(
    accessTokenPayload: AccessTokenPayload,
    page: number,
    limit: number,
    _search?: string,
    visitStatus?: VisitStatus,
  ) {
    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);

    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    // * remove spaces
    const search = _search?.trim();

    const visitsToday = await this.prisma.visit.findMany({
      where: {
        adminId: adminId,
        visitDateAndTime: {
          gte: startOfToday,
          lte: endOfToday,
        },

        // * Filter by visit status.
        ...(visitStatus !== undefined ? { visitStatus } : {}),

        // * Search the member's name or username.
        ...(search
          ? {
              member: {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } },
                  { userName: { contains: search, mode: 'insensitive' } },
                ],
              },
            }
          : {}),
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ visitDateAndTime: 'asc' }],
      select: {
        id: true,
        admin: {
          select: publicUserSelect,
        },
        member: {
          select: publicMemberSelect,
        },
        membership: true,
        visitDateAndTime: true,
        visitStatus: true,
        createdAt: true,
      },
    });

    return visitsToday;
  }

  // * Get one visit
  async findOneVisitToday(
    accessTokenPayload: AccessTokenPayload,
    visitId: string,
  ) {
    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);

    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    const visitToday = await this.prisma.visit.findFirst({
      where: {
        id: visitId,
        adminId: adminId,
        visitDateAndTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: {
        id: true,
        admin: {
          select: publicUserSelect,
        },
        member: {
          select: publicMemberSelect,
        },
        membership: true,
        visitDateAndTime: true,
        visitStatus: true,
        createdAt: true,
      },
    });
    if (!visitToday) {
      throw new NotFoundException('There No Visit Today For this member');
    }

    return visitToday;
  }

  // * Get All Stats of Visits (Admin / Staff)
  async visitStats(accessTokenPayload: AccessTokenPayload) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);

    const visitStats = await this.prisma.visit.groupBy({
      by: ['visitStatus'],
      where: {
        adminId: adminId,
        visitDateAndTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _count: {
        _all: true,
      },
    });

    let readyCount = 0;
    let checkedInCount = 0;
    let cancelledCount = 0;
    let expiredCount = 0;

    for (const stat of visitStats) {
      if (stat.visitStatus === VisitStatus.READY) {
        readyCount = stat._count._all;
      }

      if (stat.visitStatus === VisitStatus.CHECKED_IN) {
        checkedInCount = stat._count._all;
      }

      if (stat.visitStatus === VisitStatus.CANCELLED) {
        cancelledCount = stat._count._all;
      }

      if (stat.visitStatus === VisitStatus.EXPIRED) {
        expiredCount = stat._count._all;
      }
    }

    return {
      readyCount,
      checkedInCount,
      cancelledCount,
      expiredCount,
      total: readyCount + checkedInCount + cancelledCount + expiredCount,
    };
  }

  // * Get all upcoming visits (Member)
  async findAllUpcomingVisitsByMember(
    memberId: string,
    page: number,
    limit: number,
  ) {
    const now = new Date();

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

    const upcomingVisits = await this.prisma.visit.findMany({
      where: {
        adminId: adminId,
        memberId: memberId,
        visitDateAndTime: {
          gte: now,
        },
        visitStatus: VisitStatus.READY,
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        admin: {
          select: publicUserSelect,
        },
        member: {
          select: publicMemberSelect,
        },
        membership: true,
        visitDateAndTime: true,
        visitStatus: true,
        createdAt: true,
      },
      orderBy: { visitDateAndTime: 'asc' },
    });

    return upcomingVisits;
  }

  // * Get all visits (Member)
  async findAllVisitsTodayByMember(
    memberId: string,
    page: number,
    limit: number,
  ) {
    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);

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

    const visitsToday = await this.prisma.visit.findMany({
      where: {
        adminId: adminId,
        memberId: memberId,
        visitDateAndTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
        visitStatus: VisitStatus.READY,
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        admin: {
          select: publicUserSelect,
        },
        member: {
          select: publicMemberSelect,
        },
        membership: true,
        visitDateAndTime: true,
        visitStatus: true,
        createdAt: true,
      },
    });

    return visitsToday;
  }

  // * Get one visit (Member)
  async findOneVisitTodayByMember(memberId: string, visitId: string) {
    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);

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

    const visitToday = await this.prisma.visit.findFirst({
      where: {
        id: visitId,
        adminId: adminId,
        memberId: memberId,
        visitDateAndTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
        visitStatus: VisitStatus.READY,
      },
      select: {
        id: true,
        admin: {
          select: publicUserSelect,
        },
        member: {
          select: publicMemberSelect,
        },
        membership: true,
        visitDateAndTime: true,
        visitStatus: true,
        createdAt: true,
      },
    });
    if (!visitToday) {
      throw new NotFoundException('There No Visit Today For this member');
    }

    return visitToday;
  }

  // * Get All Stats of Visits (Member)
  async visitStatsOfMember(memberId: string) {
    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);

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

    const visitStats = await this.prisma.visit.groupBy({
      by: ['visitStatus'],
      where: {
        adminId: adminId,
        memberId: memberId,
        visitDateAndTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _count: {
        _all: true,
      },
    });

    let readyCount = 0;
    let checkedInCount = 0;
    let cancelledCount = 0;
    let expiredCount = 0;

    for (const stat of visitStats) {
      if (stat.visitStatus === VisitStatus.READY) {
        readyCount = stat._count._all;
      }

      if (stat.visitStatus === VisitStatus.CHECKED_IN) {
        checkedInCount = stat._count._all;
      }

      if (stat.visitStatus === VisitStatus.CANCELLED) {
        cancelledCount = stat._count._all;
      }

      if (stat.visitStatus === VisitStatus.EXPIRED) {
        expiredCount = stat._count._all;
      }
    }

    return {
      readyCount,
      checkedInCount,
      cancelledCount,
      expiredCount,
      total: readyCount + checkedInCount + cancelledCount + expiredCount,
    };
  }
}
