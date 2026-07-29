import {
  BadRequestException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import * as bcrypt from 'bcryptjs';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '@/core/types/jwt-payload.type';
import { LoginUserDto } from './dto/login-user.dto';
import {
  AccountStatus,
  ActionTokenType,
  MemberStatus,
  Role,
} from '@/generated/prisma/enums';
import { EmailService } from '@/infrastructure/email/email.service';
import { generateUsername } from '@/core/utils/generate-username';
import { CustomJwtService } from './jwt/jwt.service';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import ms, { StringValue } from 'ms';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { LoginMemberDto } from './dto/login-member.dto';
import { SetPasswordMemberDto } from './dto/set-password-member.dto';

/* eslint-disable @typescript-eslint/no-unused-vars */
@Injectable()
export class AuthProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly customJwtService: CustomJwtService,
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

    // * Generate Email Verification Token
    try {
      // * Generate Action Token
      const { rawToken, tokenHash } = this.generateActionToken();

      // * Calc the expir
      const emailVerificationTokenExpiresIn =
        this.config.getOrThrow<StringValue>(
          'EMAIL_VERIFICATION_TOKEN_EXPIRES_IN',
        );
      const expiresAt = new Date(
        Date.now() + ms(emailVerificationTokenExpiresIn),
      );

      // * Store the hash Token in DB
      await this.prisma.userActionToken.create({
        data: {
          user: { connect: { id: newUser.id } },
          tokenHash: tokenHash,
          type: ActionTokenType.EMAIL_VERIFICATION,
          expiresAt: expiresAt,
        },
      });

      // * Send Email
      await this.emailService.sendVerificationEmail(newUser.email, rawToken);
    } catch {
      throw new RequestTimeoutException('Failed to send verification email');
    }

    return {
      message: 'Please activate your account through the email we sent.',
    };
  }

  // * Login
  async login(request: Request, data: LoginUserDto) {
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
        // * Generate Action Token
        const { rawToken, tokenHash } = this.generateActionToken();

        // * Send email of verification to user
        await this.emailService.sendVerificationEmail(user.email, rawToken);
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

    // * Generate Access Token
    const accessTokenPayload: AccessTokenPayload = {
      id: user.id,
      role: user.role,
    };
    const accessToken =
      this.customJwtService.generateAccessToken(accessTokenPayload);

    // * Generate Refresh Token
    // *  Generate UUID for jti
    const jti = randomUUID();

    const refreshTokenPayload: RefreshTokenPayload = {
      id: user.id,
      role: user.role,
      jti: jti,
    };
    const refreshToken =
      this.customJwtService.generateRefreshToken(refreshTokenPayload);

    // * Hash Refresh Token
    const salt = await bcrypt.genSalt(10);
    const refreshTokenHash = await bcrypt.hash(refreshToken, salt);

    // * Save Hash Refresh Token in database
    // * Get refresh token expiration time from .env
    const refreshExpiresIn =
      user.role === Role.ADMIN
        ? this.config.getOrThrow<StringValue>('JWT_ADMIN_REFRESH_EXPIRES_IN')
        : this.config.getOrThrow<StringValue>('JWT_OWNER_REFRESH_EXPIRES_IN');

    // * Calculate expiration date
    const expiresAt = new Date(Date.now() + ms(refreshExpiresIn));

    await this.prisma.userRefreshToken.create({
      data: {
        jti: jti,
        hash: refreshTokenHash,
        user: { connect: { id: user.id } },
        expiresAt: expiresAt,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        device: this.getDevice(request.headers['user-agent']),
      },
    });

    // * Exclude Some Fields
    const { id, password, createdAt, updatedAt, ...safeUser } = user;

    return { user: safeUser, accessToken, refreshToken, refreshExpiresIn };
  }

  // * Login Member
  async loginMember(request: Request, data: LoginMemberDto) {
    // * Check if member already exist by userName before login
    const member = await this.prisma.member.findUnique({
      where: { userName: data.userName },
    });
    if (!member) {
      throw new UnauthorizedException('Invalid User Name or Password');
    }

    // * Check status of account
    if (member.status === MemberStatus.BANNED) {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact your gym administrator for assistance.',
      );
    }

    if (member.status === MemberStatus.FROZEN) {
      throw new UnauthorizedException(
        'Your account is temporarily inactive. Please contact your gym administrator to reactivate your membership.',
      );
    }

    // * Check the member if he set a password
    if (!member.password) {
      throw new UnauthorizedException(
        'Your account has not been activated yet. Please check your email and set your password to continue.',
      );
    }

    // * Check the password is match
    const passwordIsMatch = await bcrypt.compare(
      data.password,
      member.password,
    );
    if (!passwordIsMatch) {
      throw new UnauthorizedException('Invalid User Name or Password');
    }

    // * Generate Access Token
    const accessTokenPayload: AccessTokenPayload = {
      id: member.id,
      role: member.role,
    };
    const accessToken =
      this.customJwtService.generateAccessToken(accessTokenPayload);

    // * Generate Refresh Token
    // *  Generate UUID for jti
    const jti = randomUUID();

    const refreshTokenPayload: RefreshTokenPayload = {
      id: member.id,
      role: member.role,
      jti: jti,
    };
    const refreshToken =
      this.customJwtService.generateRefreshToken(refreshTokenPayload);

    // * Hash Refresh Token
    const salt = await bcrypt.genSalt(10);
    const refreshTokenHash = await bcrypt.hash(refreshToken, salt);

    // * Save Hash Refresh Token in database
    // * Get refresh token expiration time from .env
    const refreshExpiresIn = this.config.getOrThrow<StringValue>(
      'JWT_MEMBER_REFRESH_EXPIRES_IN',
    );

    // * Calculate expiration date
    const expiresAt = new Date(Date.now() + ms(refreshExpiresIn));

    await this.prisma.memberRefreshToken.create({
      data: {
        jti: jti,
        hash: refreshTokenHash,
        member: { connect: { id: member.id } },
        expiresAt: expiresAt,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        device: this.getDevice(request.headers['user-agent']),
      },
    });

    // * Exclude Some Fields
    const { id, password, createdAt, updatedAt, ...safeMember } = member;

    return { member: safeMember, accessToken, refreshToken, refreshExpiresIn };
  }

  // * Set Password Member
  async setPasswordMember(rawToken: string, data: SetPasswordMemberDto) {
    // * Hash this raw token and check if exist in DB
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const token = await this.prisma.memberActionToken.findUnique({
      where: { tokenHash: tokenHash },
      include: { member: true },
    });
    if (!token) {
      throw new BadRequestException('Invalid token');
    }

    // * Check if Token is used
    if (token.usedAt) {
      throw new BadRequestException('Token already used');
    }

    // * Check if Token is expired
    if (token.expiresAt < new Date()) {
      throw new BadRequestException('Token expired');
    }

    // * Check if we have member already in DB
    const member = await this.prisma.member.findUnique({
      where: { id: token.member.id },
    });
    if (!member) {
      throw new NotFoundException('Member Not Found');
    }

    // * Check if member has already password
    if (member.password) {
      throw new BadRequestException('Member has already password');
    }

    // * Hash the password
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);

    // * A Prisma transaction is a mechanism that executes multiple database operations as a single atomic unit,
    // * ensuring that either all operations succeed and are committed, or if any operation fails,
    // * all previous operations are rolled back, leaving the database unchanged.
    await this.prisma.$transaction([
      // * Set The Password
      this.prisma.member.update({
        where: { id: member.id },
        data: {
          password: data.password,
        },
      }),

      // * Make this token used
      this.prisma.memberActionToken.update({
        where: { id: token.id },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);
  }

  // * Refresh
  async refresh(
    refreshToken: string,
    refreshTokenPayload: RefreshTokenPayload,
  ) {
    // * Check if Refresh Token is already exist in DB
    const storedToken = await this.prisma.userRefreshToken.findUnique({
      where: { jti: refreshTokenPayload.jti },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException();
    }

    // * Check is Refresh Token valid from BD
    const isValid = await bcrypt.compare(refreshToken, storedToken.hash);

    if (!isValid) {
      throw new UnauthorizedException();
    }

    // * Check if Refresh token is expired
    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException();
    }

    // * Check if token is revoked
    if (storedToken.revokedAt) {
      throw new UnauthorizedException();
    }

    // * Verify the account is still allowed to log in
    if (storedToken.user.accountStatus !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    // * Verify the user type
    if (
      storedToken.user.role !== Role.ADMIN &&
      storedToken.user.role !== Role.OWNER
    ) {
      throw new UnauthorizedException();
    }

    // * generate new access token
    const accessTokenPayload: AccessTokenPayload = {
      id: storedToken.user.id,
      role: storedToken.user.role,
    };
    const accessToken =
      this.customJwtService.generateAccessToken(accessTokenPayload);

    return { accessToken: accessToken };
  }

  // * Refresh Member
  async refreshMember(
    refreshToken: string,
    refreshTokenPayload: RefreshTokenPayload,
  ) {
    // * Check if Refresh Token is already exist in DB
    const storedToken = await this.prisma.memberRefreshToken.findUnique({
      where: { jti: refreshTokenPayload.jti },
      include: { member: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException();
    }

    // * Check is Refresh Token valid from BD
    const isValid = await bcrypt.compare(refreshToken, storedToken.hash);

    if (!isValid) {
      throw new UnauthorizedException();
    }

    // * Check if Refresh token is expired
    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException();
    }

    // * Check if token is revoked
    if (storedToken.revokedAt) {
      throw new UnauthorizedException();
    }

    // * Verify the account is still allowed to log in
    if (storedToken.member.status !== MemberStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    // * Verify the user type
    if (storedToken.member.role !== Role.MEMBER) {
      throw new UnauthorizedException();
    }

    // * generate new access token
    const accessTokenPayload: AccessTokenPayload = {
      id: storedToken.member.id,
      role: storedToken.member.role,
    };
    const accessToken =
      this.customJwtService.generateAccessToken(accessTokenPayload);

    return { accessToken: accessToken };
  }

  // * Activate user account
  async activateAccount(rawToken: string) {
    // * Hash this raw token and check if exist in DB
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const token = await this.prisma.userActionToken.findUnique({
      where: { tokenHash: tokenHash },
      include: { user: true },
    });
    if (!token) {
      throw new BadRequestException('Invalid token');
    }

    // * Check if Token is used
    if (token.usedAt) {
      throw new BadRequestException('Token already used');
    }

    // * Check if Token is expired
    if (token.expiresAt < new Date()) {
      throw new BadRequestException('Token expired');
    }

    // * Check if we have user already in DB
    const user = await this.prisma.user.findUnique({
      where: { id: token.user.id },
    });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    // * Get Domain
    // const domain = this.config.getOrThrow<string>('FRONTEND_URL');

    // * Check if user already active his account
    if (user.accountStatus === AccountStatus.ACTIVE) {
      // return accountAlreadyActivatedTemplate(domain);
      throw new BadRequestException('Account Already Activated');
    }

    // * A Prisma transaction is a mechanism that executes multiple database operations as a single atomic unit,
    // * ensuring that either all operations succeed and are committed, or if any operation fails,
    // * all previous operations are rolled back, leaving the database unchanged.
    await this.prisma.$transaction([
      // * Make the account active
      this.prisma.user.update({
        where: { id: token.user.id },
        data: {
          accountStatus: AccountStatus.ACTIVE,
        },
      }),

      // * Make this token used
      this.prisma.userActionToken.update({
        where: { id: token.id },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    // return accountActivatedTemplate(domain);
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
      // * Generate Token
      const { rawToken, tokenHash } = this.generateActionToken();

      // * Calc the expir
      const resetPasswordTokenExpireIn = this.config.getOrThrow<StringValue>(
        'RESET_PASSWORD_TOKEN_EXPIRES_IN',
      );
      const expiresAt = new Date(Date.now() + ms(resetPasswordTokenExpireIn));

      // * Store the hash Token in DB
      await this.prisma.userActionToken.create({
        data: {
          user: { connect: { id: user.id } },
          tokenHash: tokenHash,
          type: ActionTokenType.RESET_PASSWORD,
          expiresAt: expiresAt,
        },
      });

      // * Send email
      await this.emailService.sendResetPasswordEmail(email, rawToken);
    } catch {
      throw new RequestTimeoutException('Failed to send reset password email');
    }
  }

  // * Password reset
  async resetPassword(rawToken: string, password: string) {
    // * Hash this raw token and check if exist in DB
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const token = await this.prisma.userActionToken.findUnique({
      where: { tokenHash: tokenHash },
      include: { user: true },
    });
    if (!token) {
      throw new BadRequestException('Invalid token');
    }

    // * Check if Token is used
    if (token.usedAt) {
      throw new BadRequestException('Token already used');
    }

    // * Check if Token is expired
    if (token.expiresAt < new Date()) {
      throw new BadRequestException('Token expired');
    }

    // * Check if we have user already in DB
    const user = await this.prisma.user.findUnique({
      where: { id: token.user.id },
    });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    // * Hash new Password
    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(password, salt);

    // * A Prisma transaction is a mechanism that executes multiple database operations as a single atomic unit,
    // * ensuring that either all operations succeed and are committed, or if any operation fails,
    // * all previous operations are rolled back, leaving the database unchanged.
    await this.prisma.$transaction([
      // * Save new password
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: newPassword,
        },
      }),

      // * Make this token used
      this.prisma.userActionToken.update({
        where: { id: token.id },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);
  }

  // ! Private
  // * Get Device by UA
  getDevice(userAgent?: string): string | null {
    if (!userAgent) return null;

    const parser = new UAParser(userAgent);

    const result = parser.getResult();

    return `${result.device.vendor ?? 'Unknown'} ${result.device.model ?? 'Desktop'}`;
  }

  // * Generate Action Token
  generateActionToken() {
    const rawToken = randomBytes(32).toString('hex'); // * sent to user
    const tokenHash = createHash('sha256').update(rawToken).digest('hex'); // * stored in DB
    return { rawToken, tokenHash };
  }
}
