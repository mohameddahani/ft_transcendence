import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // * Register
  async create(data: CreateUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { userName: data.userName },
          { email: data.email },
          { phoneNumber: data.phoneNumber },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.userName === data.userName) {
        throw new BadRequestException('Username already exists');
      }

      if (existingUser.email === data.email) {
        throw new BadRequestException('Email already exists');
      }

      if (existingUser.phoneNumber === data.phoneNumber) {
        throw new BadRequestException('Phone number already exists');
      }
    }

    await this.prisma.user.create({ data });
  }

  // * Get all users
  async findAll() {
    const users = await this.prisma.user.findMany();
    if (users.length <= 0) {
      throw new NotFoundException('No Users To Show');
    }
    return users;
  }

  // * Get one user
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    return user;
  }
}
