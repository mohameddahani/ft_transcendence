import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { AccessesService } from '@/core/services/access.service';
import { endOfDay, startOfDay } from 'date-fns';
import { generateActionToken } from '@/core/utils/generate-action-token';
import { AccessTokenPayload } from '@/core/types/jwt-payload.type';

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessesService: AccessesService,
  ) {}

  // * Create A Visit
  async createVisit(memberId: string) {
    // * Get Admin Id
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

    // * Check if member has membership
    const membership = await this.accessesService.validateActiveMembership(
      memberId,
      adminId,
    );

    // * Check if member is already visit today
    const now = new Date(); // ! Get Date from member
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);

    const alreadyVisited = await this.prisma.visit.findFirst({
      where: {
        adminId: adminId,
        memberId: memberId,
        visitDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    if (alreadyVisited) {
      throw new ForbiddenException('you already visited in today.');
    }

    // * Create Visit
    const { rawToken, tokenHash } = generateActionToken();

    await this.prisma.visit.create({
      data: {
        admin: { connect: { id: adminId } },
        member: { connect: { id: memberId } },
        membership: { connect: { id: membership.id } },
        visitDate: new Date(),
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
  ) {}

  // * Get one visit
  async findOneVisitToday(
    accessTokenPayload: AccessTokenPayload,
    visitId: string,
  ) {}
}
