import { UserType } from '@/generated/prisma/enums';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class OwnersService {
  constructor(private readonly prisma: PrismaService) {}

  // * Get all users
  async findAll(page: number, limit: number) {
    const users = await this.prisma.user.findMany({
      where: {
        userType: { notIn: [UserType.OWNER, UserType.USER] },
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        birthDate: true,
        userName: true,
        email: true,
        phoneNumber: true,
        companyName: true,
        userType: true,
        profileImage: true,
        isAccountVerified: true,
        accountStatus: true,
        termsAccepted: true,
        createdAt: true,
        updatedAt: true,

        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (users.length === 0) {
      throw new NotFoundException('No Users To Show');
    }

    return users;
  }

  // * Get one user
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        userType: { notIn: [UserType.OWNER, UserType.USER] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        birthDate: true,
        userName: true,
        email: true,
        phoneNumber: true,
        companyName: true,
        userType: true,
        profileImage: true,
        isAccountVerified: true,
        accountStatus: true,
        termsAccepted: true,
        createdAt: true,
        updatedAt: true,

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
}
