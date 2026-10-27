import { safeUserSelect } from '@/core/types/safe-selects.type';
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
  async findAll(page: number, limit: number) {
    const users = await this.prisma.user.findMany({
      where: {
        role: { notIn: [Role.OWNER, Role.MEMBER] },
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        ...safeUserSelect,

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
        ...safeUserSelect,

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
    });
  }
}
