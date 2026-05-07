import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dtos/register-user.dto';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginUserDto } from './dtos/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { JWTPayload } from '@/utils/types';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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
        throw new UnauthorizedException('Username already exists');
      }

      if (existingUser.email === data.email) {
        throw new UnauthorizedException('Email already exists');
      }

      if (existingUser.phoneNumber === data.phoneNumber) {
        throw new UnauthorizedException('Phone number already exists');
      }
    }

    // * Hash the password
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);

    // * Add user to database
    const newUser = await this.prisma.user.create({ data });

    // * Generate JWT
    const payload: JWTPayload = { id: newUser.id, userType: newUser.userType };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  // * Login
  async login(data: LoginUserDto) {
    // * Check if user already exist by email before login
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid Email or Password');
    }
    // * Check the password is match
    const passwordIsMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordIsMatch) {
      throw new UnauthorizedException('Invalid Email or Password');
    }

    // * Generate JWT
    const payload: JWTPayload = { id: user.id, userType: user.userType };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  // * Get current user
  async findMe(id: number) {
    return this.findOne(id);
  }

  // * Update data of user
  async update(id: number, data: UpdateUserDto) {
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
