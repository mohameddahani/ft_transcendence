import {
  Injectable,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JWTPayload } from '@/utils/types';
import { LoginUserDto } from '../dtos/login-user.dto';
import { AccountStatus } from '@/generated/prisma/enums';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '@/email/email.service';
import { ConfigService } from '@nestjs/config';
import {
  accountActivatedTemplate,
  accountAlreadyActivatedTemplate,
} from '@/utils/email-templates';

/* eslint-disable @typescript-eslint/no-unused-vars */
@Injectable()
export class AuthProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
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
    // * Exclude Some Fields
    const { id, password, createdAt, updatedAt, ...safeUser } = newUser;

    // * Send Email verification to new user
    try {
      await this.emailService.sendVerificationEmail(newUser.email, accessToken);
    } catch {
      throw new RequestTimeoutException('Failed to send verification email');
    }

    return { newUser: safeUser, accessToken };
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

    // * Check status of account
    if (user.accountStatus === AccountStatus.pending) {
      throw new UnauthorizedException(
        'Your account is pending verification. Please verify your email to continue.',
      );
    }

    if (user.accountStatus === AccountStatus.inactive) {
      throw new UnauthorizedException(
        'Your account is inactive. Please activate your account through the email we sent.',
      );
    }

    if (user.accountStatus === AccountStatus.banned) {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact support for assistance.',
      );
    }

    // * Check the password is match
    const passwordIsMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordIsMatch) {
      throw new UnauthorizedException('Invalid Email or Password');
    }

    // * Generate JWT
    const payload: JWTPayload = { id: user.id, userType: user.userType };
    const accessToken = await this.jwtService.signAsync(payload);

    // * Exclude Some Fields
    const { id, password, createdAt, updatedAt, ...safeUser } = user;

    return { user: safeUser, accessToken };
  }

  // * Activate user account
  async activateAccount(token: string) {
    // * Check if token is valid
    let payload: JWTPayload;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Access Denied, Invalid Token');
    }

    // * Check if we have user already in DB
    const id = payload.id;
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    // * Get Domain
    const domain = this.config.getOrThrow<string>('DOMAIN');

    // * Check if user already active his account
    if (user.accountStatus === AccountStatus.active) {
      return accountAlreadyActivatedTemplate(domain);
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        accountStatus: AccountStatus.active,
      },
    });

    return accountActivatedTemplate(domain);
  }
}
