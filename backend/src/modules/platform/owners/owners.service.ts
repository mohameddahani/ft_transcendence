import { privateUserSelect } from '@/core/types/safe-selects.type';
import { AccountStatus, Role } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class OwnersService {
  constructor(private readonly prisma: PrismaService) {}

  // * Get all users
  async findAll(
    page: number,
    limit: number,
    _search?: string,
    accountStatus?: AccountStatus,
    isAccountVerified?: boolean,
  ) {
    // * remove spaces
    const search = _search?.trim();

    const users = await this.prisma.user.findMany({
      where: {
        role: { notIn: [Role.OWNER, Role.MEMBER] },

        // * Filter by account status.
        ...(accountStatus !== undefined ? { accountStatus } : {}),

        // * Filter by account verification.
        ...(isAccountVerified !== undefined ? { isAccountVerified } : {}),

        // * Search identity, contact, or company details.
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { userName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phoneNumber: { contains: search } },
                { companyName: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },

      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],

      skip: (page - 1) * limit,
      take: limit,
      select: {
        ...privateUserSelect,

        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    return users;
  }

  // * Get one user
  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        role: { notIn: [Role.OWNER, Role.MEMBER] },
      },
      select: {
        ...privateUserSelect,

        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    return user;
  }

  // ! Change Status Account
  // * Active a User
  async ActiveUser(id: string) {
    // * Check if User already exist
    const user = await this.findOne(id);

    // * Check if user not Active
    if (user.accountStatus === AccountStatus.ACTIVE) {
      throw new BadRequestException('This account is already active.');
    }

    return await this.prisma.user.update({
      where: { id: id, role: { notIn: [Role.OWNER, Role.MEMBER] } },
      data: {
        accountStatus: AccountStatus.ACTIVE,
      },
      select: privateUserSelect,
    });
  }

  // * Pending a User
  async pendingUser(id: string) {
    // * Check if User already exist
    const user = await this.findOne(id);

    // * Check if user not Active
    if (user.accountStatus !== AccountStatus.ACTIVE) {
      if (user.accountStatus === AccountStatus.PENDING) {
        throw new BadRequestException('This account is already pending.');
      } else if (user.accountStatus === AccountStatus.BANNED) {
        throw new BadRequestException(
          'A banned account cannot be moved to pending. Please reactivate the account first if appropriate.',
        );
      }
    }

    return await this.prisma.user.update({
      where: { id: id, role: { notIn: [Role.OWNER, Role.MEMBER] } },
      data: {
        accountStatus: AccountStatus.PENDING,
      },
      select: privateUserSelect,
    });
  }

  // * Ban a User
  async banUser(id: string) {
    // * Check if User already exist
    const user = await this.findOne(id);

    // * Check if user not Active
    if (user.accountStatus === AccountStatus.BANNED) {
      throw new BadRequestException('This account is already banned.');
    }

    return await this.prisma.user.update({
      where: { id: id, role: { notIn: [Role.OWNER, Role.MEMBER] } },
      data: {
        accountStatus: AccountStatus.BANNED,
      },
      select: privateUserSelect,
    });
  }

  // * Get All Stats of Users (Owner)
  async userStats() {
    const [statusStats, verificationStats, roleStats] = await Promise.all([
      // * Count users grouped by account status
      this.prisma.user.groupBy({
        by: ['accountStatus'],
        _count: {
          _all: true,
        },
      }),

      // * Count users grouped by verification status
      this.prisma.user.groupBy({
        by: ['isAccountVerified'],
        _count: {
          _all: true,
        },
      }),

      // * Count users grouped by role
      this.prisma.user.groupBy({
        by: ['role'],
        _count: {
          _all: true,
        },
      }),
    ]);

    let activeCount = 0;
    let pendingCount = 0;
    let bannedCount = 0;

    let verifiedCount = 0;
    let unverifiedCount = 0;

    let adminCount = 0;
    let ownerCount = 0;

    let total = 0;

    // * Account status stats
    for (const stat of statusStats) {
      const count = stat._count._all;

      total += count;

      if (stat.accountStatus === AccountStatus.ACTIVE) {
        activeCount = count;
      }

      if (stat.accountStatus === AccountStatus.PENDING) {
        pendingCount = count;
      }

      if (stat.accountStatus === AccountStatus.BANNED) {
        bannedCount = count;
      }
    }

    // * Account verification stats
    for (const stat of verificationStats) {
      if (stat.isAccountVerified) {
        verifiedCount = stat._count._all;
      } else {
        unverifiedCount = stat._count._all;
      }
    }

    // * Role stats
    for (const stat of roleStats) {
      if (stat.role === Role.ADMIN) {
        adminCount = stat._count._all;
      }

      if (stat.role === Role.OWNER) {
        ownerCount = stat._count._all;
      }
    }

    return {
      total,
      activeCount,
      pendingCount,
      bannedCount,
      verifiedCount,
      unverifiedCount,
      adminCount,
      ownerCount,
    };
  }
}
