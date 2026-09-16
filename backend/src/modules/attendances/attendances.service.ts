import {
  AccessTokenPayload,
  MembershipWithPlan,
} from '@/core/types/jwt-payload.type';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { AttendanceCheckInDto } from './dtos/attendance-check-in.dto';
import { AccessesService } from '@/core/services/access.service';
import { AttendanceMethod, Role } from '@/generated/prisma/enums';
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

@Injectable()
export class AttendancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessesService: AccessesService,
  ) {}

  // * Confirm Attendance
  async checkInManually(
    accessTokenPayload: AccessTokenPayload,
    data: AttendanceCheckInDto,
  ) {
    // * Get Admin id
    const adminId =
      await this.accessesService.resolveAdminId(accessTokenPayload);

    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    // * Chekc if Member has Membership
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

  // ! Private
  // * ConfirmCheckIn
  private async confirmCheckIn(
    accessTokenPayload: AccessTokenPayload,
    adminId: string,
    memberId: string,
    membership: MembershipWithPlan,
    attendanceMethod: AttendanceMethod,
  ) {
    // * Check If Member try to checkin two times in one day
    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);

    const alreadyCheckedIn = await this.prisma.attendance.findFirst({
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
      throw new ForbiddenException('you already checked in today.');
    }

    // * Check if Member use all Visit Limit in the Week
    // Monday = first day of the week
    const monday = startOfWeek(now, {
      weekStartsOn: 1,
    });

    // Sunday = last day of the week
    const sunday = endOfWeek(now, {
      weekStartsOn: 1,
    });

    const attendanceCount = await this.prisma.attendance.count({
      where: {
        adminId: adminId,
        memberId: memberId,
        checkedInAt: { gte: monday, lte: sunday },
      },
    });
    if (attendanceCount >= membership.membershipPlan.weeklyVisitLimit) {
      throw new ForbiddenException(
        'Weekly attendance limit has been reached for this membership.',
      );
    }

    // * Save Attendance
    await this.prisma.attendance.create({
      data: {
        admin: { connect: { id: adminId } },
        member: { connect: { id: memberId } },
        membership: { connect: { id: membership.id } },
        staff:
          accessTokenPayload.role === Role.STAFF
            ? { connect: { id: accessTokenPayload.id } }
            : undefined, // Ignore this field. Don't do anything with staff.
        visit: { connect: { id: 'id' } }, // ! Visit id here
        attendanceMethod: attendanceMethod,
        checkedInAt: new Date(),
      },
    });
  }
}
