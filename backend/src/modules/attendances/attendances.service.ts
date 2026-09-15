import { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceCheckInDto } from './dtos/attendance-check-in.dto';
import { AccessesService } from '@/core/services/access.service';
import { MembershipStatus, Role } from '@/generated/prisma/enums';

@Injectable()
export class AttendancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessesService: AccessesService,
  ) {}

  // * Confirm Attendance
  async checkIn(
    accessTokenPayload: AccessTokenPayload,
    data: AttendanceCheckInDto,
  ) {
    // * Get Admin id
    const adminId =
      await this.accessesService.getAdminIdFromAccessTokenPayloadOfStaff(
        accessTokenPayload,
      );

    // * Check if admin is has already a subscription
    await this.accessesService.checkIfAdminHasSubscription(adminId);

    // * Chekc if Member has Membership
    const membership = await this.checkIfMemberHasMembership(
      data.memberId,
      adminId,
    );

    // * Check if Member use all Visit Limit in the Week
    const now = new Date();

    // Sunday     = 0
    // Monday     = 1
    // Tuesday    = 2
    // Wednesday  = 3
    // Thursday   = 4
    // Friday     = 5
    // Saturday   = 6
    const day = now.getDay();

    const monday = new Date(now);

    // (15th - (2 - 1) = 14th and this is monday
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6); // monday + 6 days = sunday
    sunday.setHours(23, 59, 59, 999);

    const attendanceCount = await this.prisma.attendance.count({
      where: {
        adminId: adminId,
        memberId: data.memberId,
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
        member: { connect: { id: data.memberId } },
        membership: { connect: { id: membership.id } },
        staff:
          accessTokenPayload.role === Role.STAFF
            ? { connect: { id: accessTokenPayload.id } }
            : undefined, // Ignore this field. Don't do anything with staff.
        attendanceMethod: data.attendanceMethod,
        checkedInAt: new Date(),
      },
    });
  }

  // ! Private
  // * Chekc if Member has Membership
  private async checkIfMemberHasMembership(memberId: string, adminId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: {
        adminId: adminId,
        memberId: memberId,
        membershipStatus: MembershipStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      include: {
        membershipPlan: true,
      },
    });
    if (!membership) {
      throw new NotFoundException('This Member Has No Membership');
    }
    return membership;
  }
}
