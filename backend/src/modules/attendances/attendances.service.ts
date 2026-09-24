import {
  AccessTokenPayload,
  MembershipWithPlan,
} from '@/core/types/jwt-payload.type';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessesService } from '@/core/services/access.service';
import { AttendanceMethod, Role, VisitStatus } from '@/generated/prisma/enums';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { AttendanceManualCheckInDto } from './dtos/attendance-manual-check-in.dto';
import { AttendanceQrCheckInDto } from './dtos/attendance-qr-check-in.dto';
import { createHash } from 'node:crypto';

@Injectable()
export class AttendancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessesService: AccessesService,
  ) {}

  // * Confirm Attendance Manually
  async checkInManually(
    accessTokenPayload: AccessTokenPayload,
    data: AttendanceManualCheckInDto,
  ) {
    // * Get Admin id
    const adminId =
      await this.accessesService.resolveAdminId(accessTokenPayload);

    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    // * Check if Member has Membership
    const membership = await this.accessesService.validateActiveMembership(
      data.memberId,
      adminId,
    );
    return this.confirmCheckIn(
      accessTokenPayload,
      adminId,
      data.memberId,
      membership,
      AttendanceMethod.MANUAL,
    );
  }

  // * Confirm Attendance Qr
  async checkInWithQr(
    accessTokenPayload: AccessTokenPayload,
    data: AttendanceQrCheckInDto,
  ) {
    // * Get Admin id
    const adminId =
      await this.accessesService.resolveAdminId(accessTokenPayload);

    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    // * Hash the Token from Qr
    const qrTokenHash = createHash('sha256')
      .update(data.rowToken)
      .digest('hex');

    // * Check the visit by token
    const visit = await this.prisma.visit.findUnique({
      where: {
        qrTokenHash: qrTokenHash,
      },
    });

    if (!visit || visit.adminId !== adminId) {
      throw new NotFoundException('Invalid QR code.');
    }

    // * Chekc if Member has Membership
    const membership = await this.accessesService.validateActiveMembership(
      visit.memberId,
      adminId,
    );
    return this.confirmCheckIn(
      accessTokenPayload,
      adminId,
      visit.memberId,
      membership,
      AttendanceMethod.QR_CODE,
      visit.id,
    );
  }

  // ! Private
  // * Confirm Check In
  private async confirmCheckIn(
    accessTokenPayload: AccessTokenPayload,
    adminId: string,
    memberId: string,
    membership: MembershipWithPlan,
    attendanceMethod: AttendanceMethod,
    visitId?: string,
  ) {
    // * tx is the prisma client inside a transaction
    await this.prisma.$transaction(async (tx) => {
      // * Get current date and today's boundaries
      const now = new Date();
      const startOfToday = startOfDay(now);
      const endOfToday = endOfDay(now);

      // * Check if member already checked in today
      const alreadyCheckedIn = await tx.attendance.findFirst({
        where: {
          adminId: adminId,
          memberId: memberId,
          checkedInAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      });

      if (alreadyCheckedIn) {
        throw new ForbiddenException(
          'The member has already checked in today.',
        );
      }

      // * Find today's visit
      const visit = visitId
        ? await tx.visit.findFirst({
            where: {
              id: visitId,
              adminId: adminId,
              memberId: memberId,
              visitDateAndTime: {
                gte: startOfToday,
                lte: endOfToday,
              },
            },
          })
        : await tx.visit.findFirst({
            where: {
              adminId: adminId,
              memberId: memberId,
              visitDateAndTime: {
                gte: startOfToday,
                lte: endOfToday,
              },
            },
          });

      if (!visit) {
        throw new NotFoundException('No visit found for today.');
      }

      // * Check visit status
      if (visit.visitStatus === VisitStatus.CHECKED_IN) {
        throw new ForbiddenException(
          'The member has already checked in today.',
        );
      } else if (visit.visitStatus === VisitStatus.CANCELLED) {
        throw new ForbiddenException(
          'The member already has a cancelled visit for today.',
        );
      } else if (visit.visitStatus === VisitStatus.EXPIRED) {
        throw new ForbiddenException(
          'The member already has an expired visit for today.',
        );
      }

      // * Calculate current week
      // Monday = first day of the week
      const monday = startOfWeek(now, {
        weekStartsOn: 1,
      });

      // Sunday = last day of the week
      const sunday = endOfWeek(now, {
        weekStartsOn: 1,
      });

      // * Check weekly visit limit
      const visitCount = await this.prisma.visit.count({
        where: {
          adminId: adminId,
          memberId: memberId,
          visitDateAndTime: {
            gte: monday,
            lte: sunday,
          },
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

      // * Update visit status
      await tx.visit.update({
        where: {
          id: visit.id,
        },
        data: {
          visitStatus: VisitStatus.CHECKED_IN,
        },
      });

      // * Create attendance
      await tx.attendance.create({
        data: {
          admin: { connect: { id: adminId } },
          member: { connect: { id: memberId } },
          membership: { connect: { id: membership.id } },

          staff:
            accessTokenPayload.role === Role.STAFF
              ? { connect: { id: accessTokenPayload.id } }
              : undefined, // Ignore this field. Don't do anything with staff.

          visit: { connect: { id: visit.id } },

          attendanceMethod: attendanceMethod,
          checkedInAt: now,
        },
      });
    });
  }

  // * Get All Attendances (Member)
  async findAllAttendanceByMember(
    memberId: string,
    page: number,
    limit: number,
  ) {
    // * Get Admin id
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    // * Check if Member Has Membership
    await this.accessesService.validateActiveMembership(memberId, adminId);

    const attendances = await this.prisma.attendance.findMany({
      where: { adminId: adminId, memberId: memberId },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        admin: true,
        membership: true,
        staff: true,
        visit: true,
        attendanceMethod: true,
        checkedInAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (attendances.length === 0) {
      throw new NotFoundException('There is No Attendances To Show');
    }

    return attendances;
  }

  // * Get One Attendance (Member)
  async findOneAttendanceByMember(memberId: string, attendanceId: string) {
    // * Get Admin id
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    // * Check if Member Has Membership
    await this.accessesService.validateActiveMembership(memberId, adminId);

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        id: attendanceId,
        adminId: adminId,
        memberId: memberId,
      },
      select: {
        id: true,
        admin: true,
        membership: true,
        staff: true,
        visit: true,
        attendanceMethod: true,
        checkedInAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!attendance) {
      throw new NotFoundException('There is No Attendance To Show');
    }

    return attendance;
  }
}
