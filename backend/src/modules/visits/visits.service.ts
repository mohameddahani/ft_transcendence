import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { AccessesService } from '@/core/services/access.service';
import { endOfDay, endOfWeek, startOfDay, startOfWeek } from 'date-fns';
import { generateActionToken } from '@/core/utils/generate-action-token';
import { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { CreateVisitDto } from './dtos/create-visit.dto';

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessesService: AccessesService,
  ) {}

  // * Create A Visit
  async createVisit(memberId: string, data: CreateVisitDto) {
    // * Get Admin Id
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

    // * Check if member has membership
    const membership = await this.accessesService.validateActiveMembership(
      memberId,
      adminId,
      data.visitDateAndTime,
    );

    // * Check if member is already visit twice on choosen day
    const startOfToday = startOfDay(data.visitDateAndTime);
    const endOfToday = endOfDay(data.visitDateAndTime);

    const alreadyVisited = await this.prisma.visit.findFirst({
      where: {
        adminId: adminId,
        memberId: memberId,
        visitDateAndTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    if (alreadyVisited) {
      throw new ForbiddenException('you already visited in today.');
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
    const attendanceCount = await this.prisma.attendance.count({
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

    await this.prisma.visit.create({
      data: {
        admin: { connect: { id: adminId } },
        member: { connect: { id: memberId } },
        membership: { connect: { id: membership.id } },
        visitDateAndTime: data.visitDateAndTime,
        qrTokenHash: tokenHash,
        qrExpiresAt: endOfToday,
      },
    });
    return { rawToken: rawToken };
  }

  // * Get all visits
  async findAllVisitsToday(
    accessTokenPayload: AccessTokenPayload,
    page: number,
    limit: number,
  ) {
    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);

    // * Get Admin id
    const adminId =
      await this.accessesService.resolveAdminId(accessTokenPayload);

    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    const visitsToday = await this.prisma.visit.findMany({
      where: {
        adminId: adminId,
        visitDateAndTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        admin: true,
        member: true,
        membership: true,
        visitDateAndTime: true,
        visitStatus: true,
        createdAt: true,
      },
    });
    if (visitsToday.length === 0) {
      throw new NotFoundException('There No Visits Today');
    }

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

    // * Get Admin id
    const adminId =
      await this.accessesService.resolveAdminId(accessTokenPayload);

    // * Check if admin is has already a subscription
    await this.accessesService.validateActiveSubscription(adminId);

    const visitToday = await this.prisma.visit.findUnique({
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
        admin: true,
        member: true,
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
}
