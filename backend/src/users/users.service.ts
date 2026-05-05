import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterUserDto } from './dtos/register-user.dto';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginUserDto } from './dtos/login-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // * Register
  async register(data: RegisterUserDto) {
    // * Check if user already exist before register
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

    // * Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    data.password = hashedPassword;

    // todo: Generate JWT token
    // * Add user to database
    await this.prisma.user.create({ data });
  }

  // * Login
  async login(data: LoginUserDto) {
    // * Check if user already exist by email before login
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      throw new BadRequestException('Invalid Email or Password');
    }
    // * Check the password is match
    const passwordIsMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordIsMatch) {
      throw new BadRequestException('Invalid Email or Password');
    }

    // todo: Generate JWT token
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

  // * Delete one user
  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }
    await this.prisma.user.delete({ where: { id } });
  }
}
