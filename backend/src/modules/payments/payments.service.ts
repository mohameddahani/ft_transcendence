import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { AccessesService } from '@/core/access/access.service';
import { publicMemberSelect } from '@/core/types/safe-selects.type';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessesService: AccessesService,
  ) {}

  // * Get all Payments
  async findAllPayments(
    accessTokenPayload: AccessTokenPayload,
    page: number,
    limit: number,
    _search?: string,
    from?: Date,
    to?: Date,
  ) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    // * remove spaces
    const search = _search?.trim();

    // * Check Date And Time
    if (from && to && from.getTime() > to.getTime()) {
      throw new BadRequestException(
        'The start date must be before or equal to the end date.',
      );
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        adminId: adminId,

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

        // * Filter by payment date and time.
        ...(from || to
          ? {
              paidAt: {
                ...(from !== undefined ? { gte: from } : {}),
                ...(to !== undefined ? { lte: to } : {}),
              },
            }
          : {}),
      },

      // * Most recent payment first.
      orderBy: [{ paidAt: 'desc' }, { id: 'desc' }],

      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        adminId: true,
        member: {
          select: publicMemberSelect,
        },
        amount: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return payments;
  }

  // * Get one payment
  async findOnePayment(accessTokenPayload: AccessTokenPayload, id: string) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    const payment = await this.prisma.payment.findFirst({
      where: {
        adminId: adminId,
        id: id,
      },
      select: {
        id: true,
        adminId: true,
        member: {
          select: publicMemberSelect,
        },
        amount: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment Not Found!');
    }

    return payment;
  }

  // * Get All Stats of Payments (Admin)
  async paymentStatsOfAdmin(accessTokenPayload: AccessTokenPayload) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    const paymentStatsOfAdmin = await this.prisma.payment.aggregate({
      where: {
        adminId,
      },
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      },
    });

    return {
      totalAmount: paymentStatsOfAdmin._sum.amount,
      totalPayments: paymentStatsOfAdmin._count._all,
    };
  }

  // * Get All Stats of Payments (Staff)
  async paymentStatsOfStaff(accessTokenPayload: AccessTokenPayload) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    const paymentStatsOfAdmin = await this.prisma.payment.aggregate({
      where: {
        adminId,
      },
      _count: {
        _all: true,
      },
    });

    return {
      totalPayments: paymentStatsOfAdmin._count._all,
    };
  }

  // * Get all Payments (Member)
  async findAllPaymentsMember(
    memberId: string,
    page: number,
    limit: number,
    from?: Date,
    to?: Date,
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

    // * Check Date And Time
    if (from && to && from.getTime() > to.getTime()) {
      throw new BadRequestException(
        'The start date must be before or equal to the end date.',
      );
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        memberId: memberId,
        adminId: adminId,

        // * Filter by payment date and time.
        ...(from || to
          ? {
              paidAt: {
                ...(from !== undefined ? { gte: from } : {}),
                ...(to !== undefined ? { lte: to } : {}),
              },
            }
          : {}),
      },

      // * Most recent payment first.
      orderBy: [{ paidAt: 'desc' }, { id: 'desc' }],

      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        adminId: true,
        member: {
          select: publicMemberSelect,
        },
        amount: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!payments) {
      throw new NotFoundException('There Is No Payments To Show');
    }

    return payments;
  }

  // * Get one payment (Member)
  async findOnePaymentMember(memberId: string, id: string) {
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

    const payment = await this.prisma.payment.findFirst({
      where: {
        id: id,
        memberId: memberId,
      },
      select: {
        id: true,
        adminId: true,
        member: {
          select: publicMemberSelect,
        },
        amount: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment Not Found');
    }

    return payment;
  }

  // * Get All Stats of Payments (Member)
  async paymentStatsOfMember(memberId: string) {
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

    const paymentStatsOfAdmin = await this.prisma.payment.aggregate({
      where: {
        adminId,
        memberId,
      },
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      },
    });

    return {
      totalAmount: paymentStatsOfAdmin._sum.amount,
      totalPayments: paymentStatsOfAdmin._count._all,
    };
  }
}
