import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterUserDto } from './dtos/register-user.dto';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginUserDto } from './dtos/login-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { AuthProvider } from './providers/auth.provider';

/* eslint-disable @typescript-eslint/no-unused-vars */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authProvider: AuthProvider,
  ) {}

  // * Register
  async register(data: RegisterUserDto) {
    return this.authProvider.register(data);
  }

  // * Login
  async login(data: LoginUserDto) {
    return this.authProvider.login(data);
  }

  // * Get current user
  async findMe(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    // * Exclude Some Fields
    const { id: userId, password, createdAt, updatedAt, ...safeUser } = user;
    return safeUser;
  }

  // * Update data of user
  async update(id: string, data: UpdateUserDto) {
    // * Check if we have user already in DB
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    // * Check if user update the username: (we need to check if username is unique)
    const existingData = await this.prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: id } }, // exclude current user
          {
            OR: [
              { userName: data.userName },
              { email: data.email },
              { phoneNumber: data.phoneNumber },
            ],
          },
        ],
      },
    });

    if (existingData) {
      if (existingData.userName === data.userName) {
        // * 409 = duplicate data
        throw new ConflictException('Username already exists');
      }

      if (existingData.email === data.email) {
        // * 409 = duplicate data
        throw new ConflictException('Email already exists');
      }

      if (existingData.phoneNumber === data.phoneNumber) {
        // * 409 = duplicate data
        throw new ConflictException('Phone number already exists');
      }
    }

    // * Check if user update the password: (we need to hash it)
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    // * Save new data to user
    await this.prisma.user.update({ where: { id }, data });
  }

  async uploadProfileImage(id: string, filename: string) {
    // * Check if we have user already in DB
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    // * Set new image name in DB
    user.profileImage = filename;

    // * Save new data to user
    await this.prisma.user.update({ where: { id }, data: user });
  }

  // ! All this routes is Access only by Admin
  // * Get all users
  async findAll(page: number, limit: number) {
    const users = await this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    if (users.length <= 0) {
      throw new NotFoundException('No Users To Show');
    }

    // * Exclude Some Fields
    const safeUsers = users.map(({ password, ...user }) => user);

    return safeUsers;
  }

  // * Get one user
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    // * Exclude Some Fields
    const { password, ...safeUser } = user;
    return safeUser;
  }

  // * Delete one user
  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    await this.prisma.user.delete({ where: { id } });
  }
}
