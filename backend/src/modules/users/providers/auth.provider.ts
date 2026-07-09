import {
  BadRequestException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JWTPayload } from '@/core/types/jwt-payload.type';
import { LoginUserDto } from '../dtos/login-user.dto';
import { AccountStatus } from '@/generated/prisma/enums';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '@/infrastructure/email/email.service';
import { ConfigService } from '@nestjs/config';
import {
  accountActivatedTemplate,
  accountAlreadyActivatedTemplate,
} from '@/infrastructure/email/templates';
import { generateUsername } from '@/core/utils/generate-username';

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
        OR: [{ email: data.email }, { phoneNumber: data.phoneNumber }],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new UnauthorizedException('Email already exists');
      }

      if (existingUser.phoneNumber === data.phoneNumber) {
        throw new UnauthorizedException('Phone number already exists');
      }
    }

    // * Check if user accept the terms
    if (!data.termsAccepted) {
      throw new BadRequestException(
        'You must accept the Terms and Conditions to create an account.',
      );
    }

    // * Genarate a userName
    let userName: string;
    while (true) {
      userName = generateUsername(data.firstName, data.lastName);

      // * Check if username already exist before register
      const existingUserName = await this.prisma.user.findUnique({
        where: {
          userName: userName,
        },
      });
      if (!existingUserName) {
        break;
      }
    }

    // * Hash the password
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);

    // * Add user to database
    const newUser = await this.prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        birthDate: data.birthDate,
        userName: userName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
        companyName: data.companyName,
        termsAccepted: data.termsAccepted,
      },
    });

    // * Generate JWT
    const payload: JWTPayload = { id: newUser.id, userType: newUser.userType };
    const accessToken = await this.jwtService.signAsync(payload);

    // * Send Email verification to new user
    try {
      await this.emailService.sendVerificationEmail(newUser.email, accessToken);
    } catch {
      throw new RequestTimeoutException('Failed to send verification email');
    }

    return {
      message: 'Please activate your account through the email we sent.',
    };
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
    if (user.accountStatus === AccountStatus.PENDING) {
      throw new UnauthorizedException(
        'Your account is pending verification. Please contact support for assistance.',
      );
    }

    if (user.accountStatus === AccountStatus.INACTIVE) {
      // * Send Email verification to new user if he try to login without activating his account
      try {
        // * Generate JWT
        const payload: JWTPayload = { id: user.id, userType: user.userType };
        const accessToken = await this.jwtService.signAsync(payload);

        // * Send email of verification to user
        await this.emailService.sendVerificationEmail(user.email, accessToken);
      } catch {
        throw new RequestTimeoutException('Failed to send verification email');
      }
      throw new UnauthorizedException(
        'Your account is inactive. Please activate your account through the email we sent.',
      );
    }

    if (user.accountStatus === AccountStatus.BANNED) {
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
    const domain = this.config.getOrThrow<string>('FRONTEND_URL');

    // * Check if user already active his account
    if (user.accountStatus === AccountStatus.ACTIVE) {
      return accountAlreadyActivatedTemplate(domain);
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        accountStatus: AccountStatus.ACTIVE,
      },
    });

    return accountActivatedTemplate(domain);
  }

  // * Forgot password
  async forgotPassword(email: string) {
    // * Check if user already exist by email before login
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid Email');
    }

    // * Send Email of reset password to user
    try {
      // * Generate JWT
      const payload: JWTPayload = { id: user.id, userType: user.userType };
      const accessToken = await this.jwtService.signAsync(payload);

      // * Send email
      await this.emailService.sendResetPasswordEmail(email, accessToken);
    } catch {
      throw new RequestTimeoutException('Failed to send reset password email');
    }
  }

  // * Reset password
  async resetPassword(token: string, password: string) {
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

    // * Hash new Password
    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(password, salt);

    // * Save new password
    await this.prisma.user.update({
      where: { id },
      data: {
        password: newPassword,
      },
    });
  }
}
