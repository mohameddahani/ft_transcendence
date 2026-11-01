/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dtos/register-user.dto';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import * as bcrypt from 'bcryptjs';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '@/core/types/jwt-payload.type';
import { LoginUserDto } from './dtos/login-user.dto';
import { AccountStatus, ActionTokenType, Role } from '@/generated/prisma/enums';
import { EmailService } from '@/infrastructure/email/email.service';
import { generateUsername } from '@/core/utils/generate-username';
import { CustomJwtService } from './jwt/jwt.service';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import ms, { StringValue } from 'ms';
import { createHash, randomUUID } from 'node:crypto';
import { LoginMemberDto } from './dtos/login-member.dto';
import { SetPasswordMemberDto } from './dtos/set-password-member.dto';
import { LoginStaffDto } from './dtos/login-staff.dto';
import { generateActionToken } from '@/core/utils/generate-action-token';
import { SetPasswordStaffDto } from './dtos/set-password-staff.dto';
import {
  privateMemberSelect,
  privateStaffSelect,
  privateUserSelect,
} from '@/core/types/safe-selects.type';
import {
  DEFAULT_AVATARS,
  DEFAULT_AVATARS_ID,
} from '@/core/constants/default-avatars.constants';

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
        throw new ConflictException('Email already exists');
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
    let firstNameCharCount = 1;
    while (true) {
      userName = generateUsername(
        data.firstName,
        data.lastName,
        firstNameCharCount++,
      );

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
        profileImageUrl: DEFAULT_AVATARS.ADMIN,
        profileImagePublicId: DEFAULT_AVATARS_ID.ADMIN,
        companyName: data.companyName,
        termsAccepted: data.termsAccepted,

        // ! BLOCK_CHAINE
        walletAddress: data.walletAddress,
      },
    });

    // * Generate Email Verification Token
    // * Generate Action Token
    const { rawToken, tokenHash } = generateActionToken();

    // * Calc the expir
    const emailVerificationTokenExpiresIn = this.config.getOrThrow<StringValue>(
      'EMAIL_VERIFICATION_TOKEN_EXPIRES_IN',
    );
    const expiresAt = new Date(
      Date.now() + ms(emailVerificationTokenExpiresIn),
    );

    // * Store the hash Token in DB
    const actionToken = await this.prisma.userActionToken.create({
      data: {
        user: { connect: { id: newUser.id } },
        tokenHash: tokenHash,
        type: ActionTokenType.EMAIL_VERIFICATION,
        expiresAt: expiresAt,
      },
    });

    try {
      // * Send Email
      await this.emailService.sendVerificationEmail(newUser.email, rawToken);
    } catch {
      // * Remove action token if email faild to send
      await this.prisma.userActionToken.deleteMany({
        where: { id: actionToken.id },
      });

      throw new InternalServerErrorException(
        'Your account was created, but we could not send the verification email. Please try logging in again to request a new verification email.',
      );
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
      select: {
        ...privateUserSelect,
        password: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid Email or Password');
    }

    // * Check the password is match
    const passwordIsMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordIsMatch) {
      throw new UnauthorizedException('Invalid Email or Password');
    }

    // * Check if the user's account is verified.
    if (!user.isAccountVerified) {
      throw new UnauthorizedException(
        'Please verify your email address to continue.',
      );
    }

    // * Check if the user has accepted the terms.
    if (!user.termsAccepted) {
      throw new UnauthorizedException(
        'Please accept the terms and conditions to continue.',
      );
    }

    // * Check status of account
    if (user.accountStatus === AccountStatus.PENDING) {
      throw new UnauthorizedException(
        'Your account is pending verification. Please contact support for assistance.',
      );
    }

    if (user.accountStatus === AccountStatus.BANNED) {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact support for assistance.',
      );
    }

    if (!user.isAccountVerified) {
      // * Check whether a valid verification token already exists.
      const existingToken = await this.prisma.userActionToken.findFirst({
        where: {
          userId: user.id,
          type: ActionTokenType.EMAIL_VERIFICATION,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingToken) {
        throw new UnauthorizedException(
          'A verification email has already been requested. Please check your inbox.',
        );
      }

      // * Send Email verification to new user if he try to login without activating his account
      // * Generate Action Token
      const { rawToken, tokenHash } = generateActionToken();

      // * Calc the expir
      const emailVerificationTokenExpiresIn =
        this.config.getOrThrow<StringValue>(
          'EMAIL_VERIFICATION_TOKEN_EXPIRES_IN',
        );
      const expiresAt = new Date(
        Date.now() + ms(emailVerificationTokenExpiresIn),
      );

      // * Store the hash Token in DB
      const actionToken = await this.prisma.userActionToken.create({
        data: {
          user: { connect: { id: user.id } },
          tokenHash: tokenHash,
          type: ActionTokenType.EMAIL_VERIFICATION,
          expiresAt: expiresAt,
        },
      });

      try {
        // * Send email of verification to user
        await this.emailService.sendVerificationEmail(user.email, rawToken);
      } catch {
        // * Remove action token if email faild to send
        await this.prisma.userActionToken.deleteMany({
          where: { id: actionToken.id },
        });

        throw new InternalServerErrorException(
          'We could not send a new verification email. Please try logging in again to request a new verification email or contact support if the problem continues.',
        );
      }
      throw new UnauthorizedException(
        'Your account is inactive. Please activate your account through the email we sent.',
      );
    }

    // * Generate Access Token
    const accessTokenPayload: AccessTokenPayload = {
      id: user.id,
      role: user.role,
    };
    const accessToken =
      await this.customJwtService.generateAccessToken(accessTokenPayload);

    // * Generate Refresh Token
    // *  Generate UUID for jti
    const jti = randomUUID();

    const refreshTokenPayload: RefreshTokenPayload = {
      id: user.id,
      role: user.role,
      jti: jti,
    };
    const refreshToken =
      await this.customJwtService.generateRefreshToken(refreshTokenPayload);

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

    // * Exculde Some Fields
    const { password, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken,
      refreshExpiresIn,
    };
  }

  // * Logout (Admin)
  async logoutAdmin(
    refreshToken: string,
    refreshTokenPayload: RefreshTokenPayload,
  ) {
    // * Check if Refresh Token is already exist in DB
    const storedToken = await this.prisma.userRefreshToken.findUnique({
      where: { jti: refreshTokenPayload.jti },
      include: { user: { select: privateUserSelect } },
    });

    if (!storedToken) {
      throw new UnauthorizedException();
    }

    // * Verify the JWT payload matches the database
    if (storedToken.userId !== refreshTokenPayload.id) {
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

    // * Verify the user type
    if (storedToken.user.role !== Role.ADMIN) {
      throw new UnauthorizedException();
    }

    // * Revoke the refresh Token
    await this.prisma.userRefreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  // * Logout (Owner)
  async logoutOwner(
    refreshToken: string,
    refreshTokenPayload: RefreshTokenPayload,
  ) {
    // * Check if Refresh Token is already exist in DB
    const storedToken = await this.prisma.userRefreshToken.findUnique({
      where: { jti: refreshTokenPayload.jti },
      include: { user: { select: privateUserSelect } },
    });

    if (!storedToken) {
      throw new UnauthorizedException();
    }

    // * Verify the JWT payload matches the database
    if (storedToken.userId !== refreshTokenPayload.id) {
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

    // * Verify the user type
    if (storedToken.user.role !== Role.OWNER) {
      throw new UnauthorizedException();
    }

    // * Revoke the refresh Token
    await this.prisma.userRefreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  // * Logout (Member)
  async logoutMember(
    refreshToken: string,
    refreshTokenPayload: RefreshTokenPayload,
  ) {
    // * Check if Refresh Token is already exist in DB
    const storedToken = await this.prisma.memberRefreshToken.findUnique({
      where: { jti: refreshTokenPayload.jti },
      include: { member: { select: privateMemberSelect } },
    });

    if (!storedToken) {
      throw new UnauthorizedException();
    }

    // * Verify the JWT payload matches the database
    if (storedToken.memberId !== refreshTokenPayload.id) {
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

    // * Verify the user type
    if (storedToken.member.role !== Role.MEMBER) {
      throw new UnauthorizedException();
    }

    // * Revoke the refresh Token
    await this.prisma.memberRefreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  // * Login Staff
  async loginStaff(request: Request, data: LoginStaffDto) {
    // * Check if staff already exist by userName before login
    const staff = await this.prisma.staff.findUnique({
      where: { userName: data.userName },
      select: {
        ...privateStaffSelect,
        password: true,
      },
    });

    if (!staff) {
      throw new UnauthorizedException('Invalid User Name or Password');
    }

    // * Check the member if he set a password
    if (!staff.password) {
      // * Check whether a valid verification token already exists.
      const existingToken = await this.prisma.staffActionToken.findFirst({
        where: {
          StaffId: staff.id,
          type: ActionTokenType.SET_PASSWORD,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingToken) {
        throw new UnauthorizedException(
          'A set password email has already been requested. Please check your inbox.',
        );
      }

      // * Send Email verification to new user if he try to login without activating his account
      // * Generate Action Token
      const { rawToken, tokenHash } = generateActionToken();

      // * Calc the expir
      const setPasswordTokenExpireIn = this.config.getOrThrow<StringValue>(
        'SET_PASSWORD_TOKEN_EXPIRES_IN',
      );
      const expiresAt = new Date(Date.now() + ms(setPasswordTokenExpireIn));

      // * Store the hash Token in DB
      const actionToken = await this.prisma.staffActionToken.create({
        data: {
          staff: { connect: { id: staff.id } },
          tokenHash: tokenHash,
          type: ActionTokenType.SET_PASSWORD,
          expiresAt: expiresAt,
        },
      });

      try {
        // * Send email of verification to user
        await this.emailService.sendSetPasswordStaffEmail(
          staff.userName,
          staff.email,
          rawToken,
        );
      } catch {
        // * Remove action token if email faild to send
        await this.prisma.staffActionToken.deleteMany({
          where: { id: actionToken.id },
        });

        throw new InternalServerErrorException(
          'We could not send a new password setup email. Please try logging in again later or contact your administrator if the problem continues.',
        );
      }

      throw new UnauthorizedException(
        'Your account has not been activated yet. Please check your email and set your password to continue.',
      );
    }

    // * Check the password is match
    const passwordIsMatch = await bcrypt.compare(data.password, staff.password);
    if (!passwordIsMatch) {
      throw new UnauthorizedException('Invalid User Name or Password');
    }

    // * Check status of account
    if (staff.accountStatus === AccountStatus.PENDING) {
      throw new UnauthorizedException(
        'Your account is pending verification. Please contact admin for assistance.',
      );
    }

    if (staff.accountStatus === AccountStatus.BANNED) {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact admin for assistance.',
      );
    }

    // * Generate Access Token
    const accessTokenPayload: AccessTokenPayload = {
      id: staff.id,
      role: staff.role,
    };
    const accessToken =
      await this.customJwtService.generateAccessToken(accessTokenPayload);

    // * Generate Refresh Token
    // * Generate UUID for jti
    const jti = randomUUID();

    const refreshTokenPayload: RefreshTokenPayload = {
      id: staff.id,
      role: staff.role,
      jti: jti,
    };
    const refreshToken =
      await this.customJwtService.generateRefreshToken(refreshTokenPayload);

    // * Hash Refresh Token
    const salt = await bcrypt.genSalt(10);
    const refreshTokenHash = await bcrypt.hash(refreshToken, salt);

    // * Save Hash Refresh Token in database
    // * Get refresh token expiration time from .env
    const refreshExpiresIn = this.config.getOrThrow<StringValue>(
      'JWT_STAFF_REFRESH_EXPIRES_IN',
    );

    // * Calculate expiration date
    const expiresAt = new Date(Date.now() + ms(refreshExpiresIn));

    await this.prisma.staffRefreshToken.create({
      data: {
        jti: jti,
        hash: refreshTokenHash,
        staff: { connect: { id: staff.id } },
        expiresAt: expiresAt,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        device: this.getDevice(request.headers['user-agent']),
      },
    });

    // * Exculde Some Fields
    const { password, ...safeStaff } = staff;

    return {
      staff: safeStaff,
      accessToken,
      refreshToken,
      refreshExpiresIn,
    };
  }

  // * Logout (Staff)
  async logoutStaff(
    refreshToken: string,
    refreshTokenPayload: RefreshTokenPayload,
  ) {
    // * Check if Refresh Token is already exist in DB
    const storedToken = await this.prisma.staffRefreshToken.findUnique({
      where: { jti: refreshTokenPayload.jti },
      include: { staff: { select: privateStaffSelect } },
    });

    if (!storedToken) {
      throw new UnauthorizedException();
    }

    // * Verify the JWT payload matches the database
    if (storedToken.staffId !== refreshTokenPayload.id) {
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

    // * Verify the user type
    if (storedToken.staff.role !== Role.STAFF) {
      throw new UnauthorizedException();
    }

    // * Revoke the refresh Token
    await this.prisma.staffRefreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  // * Set Password Staff
  async setPasswordStaff(rawToken: string, data: SetPasswordStaffDto) {
    // * Hash this raw token and check if exist in DB
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const token = await this.prisma.staffActionToken.findUnique({
      where: { tokenHash: tokenHash, type: ActionTokenType.SET_PASSWORD },
      include: { staff: { select: privateStaffSelect } },
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

    // * Check if we have staff already in DB
    const staff = await this.prisma.staff.findUnique({
      where: { id: token.staff.id },
    });
    if (!staff) {
      throw new NotFoundException('Staff Not Found');
    }

    // * Check if staff has already password
    if (staff.password) {
      throw new BadRequestException('Staff has already password');
    }

    // * Hash the password
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);

    // * A Prisma transaction is a mechanism that executes multiple database operations as a single atomic unit,
    // * ensuring that either all operations succeed and are committed, or if any operation fails,
    // * all previous operations are rolled back, leaving the database unchanged.
    await this.prisma.$transaction(async (tx) => {
      // * Set The Password
      const { count: countStaff } = await tx.staff.updateMany({
        where: { id: staff.id, password: null },
        data: {
          password: data.password,
        },
      });

      // * Another request already consumed it
      if (countStaff !== 1) {
        throw new BadRequestException('Staff already has a password');
      }

      // * Make this token used
      const { count: countToken } = await tx.staffActionToken.updateMany({
        where: {
          id: token.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
          type: ActionTokenType.SET_PASSWORD,
        },
        data: {
          usedAt: new Date(),
        },
      });

      // * Another request already consumed it
      if (countToken !== 1) {
        throw new BadRequestException('Invalid or expired token');
      }

      // * Invalidate any other active SET_PASSWORD links
      await tx.staffActionToken.updateMany({
        where: {
          StaffId: staff.id,
          type: ActionTokenType.SET_PASSWORD,
          usedAt: null,
          id: {
            not: token.id,
          },
        },
        data: {
          usedAt: new Date(),
        },
      });
    });
  }

  // * Forgot password (Staff)
  async forgotPasswordStaff(username: string) {
    // * Check if staff already exist by username
    const staff = await this.prisma.staff.findUnique({
      where: { userName: username },
    });
    if (!staff) {
      throw new NotFoundException('Staff Not Found');
    }

    // * Check whether a valid verification token already exists.
    const existingToken = await this.prisma.staffActionToken.findFirst({
      where: {
        StaffId: staff.id,
        type: ActionTokenType.RESET_PASSWORD,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingToken) {
      throw new UnauthorizedException(
        'A reset password email has already been requested. Please check your inbox.',
      );
    }

    // * Send Email of reset password to Staff
    // * Generate Action Token
    const { rawToken, tokenHash } = generateActionToken();

    // * Calc the expir
    const resetPasswordTokenExpireIn = this.config.getOrThrow<StringValue>(
      'RESET_PASSWORD_TOKEN_EXPIRES_IN',
    );
    const expiresAt = new Date(Date.now() + ms(resetPasswordTokenExpireIn));

    // * Store the hash Token in DB
    const actionToken = await this.prisma.staffActionToken.create({
      data: {
        staff: { connect: { id: staff.id } },
        tokenHash: tokenHash,
        type: ActionTokenType.RESET_PASSWORD,
        expiresAt: expiresAt,
      },
    });

    try {
      // * Send email
      await this.emailService.sendResetPasswordStaffEmail(
        staff.email,
        rawToken,
      );
    } catch {
      // * Remove action token if email faild to send
      await this.prisma.staffActionToken.deleteMany({
        where: { id: actionToken.id },
      });

      throw new InternalServerErrorException(
        'We could not send the password reset email. Please try again later or contact your administrator if the problem continues.',
      );
    }
    return {
      message: 'Please check your email and set your password',
    };
  }

  // * Password reset (Staff)
  async resetPasswordStaff(rawToken: string, password: string) {
    // * Hash this raw token and check if exist in DB
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const token = await this.prisma.staffActionToken.findUnique({
      where: { tokenHash: tokenHash, type: ActionTokenType.RESET_PASSWORD },
      include: { staff: { select: privateStaffSelect } },
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

    // * Check if we have staff already in DB
    const staff = await this.prisma.staff.findUnique({
      where: { id: token.staff.id },
    });
    if (!staff) {
      throw new NotFoundException('Staff Not Found');
    }

    // * Hash new Password
    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(password, salt);

    // * A Prisma transaction is a mechanism that executes multiple database operations as a single atomic unit,
    // * ensuring that either all operations succeed and are committed, or if any operation fails,
    // * all previous operations are rolled back, leaving the database unchanged.
    await this.prisma.$transaction(async (tx) => {
      // * Atomically consume RESET_PASSWORD token
      const { count: countToken } = await tx.staffActionToken.updateMany({
        where: {
          id: token.id,
          StaffId: token.staff.id,
          type: ActionTokenType.RESET_PASSWORD,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          usedAt: new Date(),
        },
      });

      // * Another request already consumed it
      if (countToken !== 1) {
        throw new BadRequestException('Invalid or expired token');
      }

      // * Change password
      await tx.staff.update({
        where: {
          id: token.staff.id,
        },
        data: {
          password: newPassword,
        },
      });

      // * Invalidate all other RESET_PASSWORD links
      await tx.staffActionToken.updateMany({
        where: {
          StaffId: token.staff.id,
          type: ActionTokenType.RESET_PASSWORD,
          usedAt: null,
          id: {
            not: token.id,
          },
        },
        data: {
          usedAt: new Date(),
        },
      });

      // * Revoke all staff sessions
      await tx.staffRefreshToken.updateMany({
        where: {
          staffId: token.staff.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    });
  }

  // * Email Change (Staff)
  async emailChangeStaff(rawToken: string) {
    // * Hash raw token
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const token = await this.prisma.staffActionToken.findUnique({
      where: {
        tokenHash,
        type: ActionTokenType.EMAIL_CHANGE,
        pendingEmail: {
          not: null,
        },
      },
      include: {
        staff: {
          select: privateStaffSelect,
        },
      },
    });

    if (!token) {
      throw new BadRequestException('Invalid token');
    }

    // * Check if token is already used
    if (token.usedAt) {
      throw new BadRequestException('Token already used');
    }

    // * Check if token is expired
    if (token.expiresAt < new Date()) {
      throw new BadRequestException('Token expired');
    }

    // * Make sure pending email exists
    if (!token.pendingEmail) {
      throw new BadRequestException('Invalid pending email');
    }

    // * Get pending email from token
    const pendingEmail = token.pendingEmail;

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // * Atomically consume EMAIL_CHANGE token
      const { count } = await tx.staffActionToken.updateMany({
        where: {
          id: token.id,
          StaffId: token.staff.id,
          type: ActionTokenType.EMAIL_CHANGE,
          pendingEmail,
          usedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          usedAt: now,
        },
      });

      // * Another request already consumed or expired this token
      if (count !== 1) {
        throw new BadRequestException('Invalid or expired token');
      }

      // * Save new email
      await tx.staff.update({
        where: {
          id: token.staff.id,
        },
        data: {
          email: pendingEmail,
        },
      });

      // * Invalidate all other active EMAIL_CHANGE tokens
      await tx.staffActionToken.updateMany({
        where: {
          StaffId: token.staff.id,
          type: ActionTokenType.EMAIL_CHANGE,
          usedAt: null,
          id: {
            not: token.id,
          },
        },
        data: {
          usedAt: now,
        },
      });
    });
  }

  // * Login Member
  async loginMember(request: Request, data: LoginMemberDto) {
    // * Check if member already exist by userName before login
    const member = await this.prisma.member.findUnique({
      where: { userName: data.userName },
      select: {
        ...privateMemberSelect,
        password: true,

        // ! BLOCK_CHAINE
        admin: {
          select: {
            walletAddress: true,
          },
        },
      },
    });

    if (!member) {
      throw new UnauthorizedException('Invalid User Name or Password');
    }

    // * Check the member if he set a password
    if (!member.password) {
      // * Check whether a valid verification token already exists.
      const existingToken = await this.prisma.memberActionToken.findFirst({
        where: {
          memberId: member.id,
          type: ActionTokenType.SET_PASSWORD,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingToken) {
        throw new UnauthorizedException(
          'A set password email has already been requested. Please check your inbox.',
        );
      }

      // * Send Email verification to new user if he try to login without activating his account
      // * Generate Action Token
      const { rawToken, tokenHash } = generateActionToken();

      // * Calc the expir
      const setPasswordTokenExpireIn = this.config.getOrThrow<StringValue>(
        'SET_PASSWORD_TOKEN_EXPIRES_IN',
      );
      const expiresAt = new Date(Date.now() + ms(setPasswordTokenExpireIn));

      // * Store the hash Token in DB
      const actionToken = await this.prisma.memberActionToken.create({
        data: {
          member: { connect: { id: member.id } },
          tokenHash: tokenHash,
          type: ActionTokenType.SET_PASSWORD,
          expiresAt: expiresAt,
        },
      });

      try {
        // * Send email of verification to user
        await this.emailService.sendSetPasswordMemberEmail(
          member.userName,
          member.email,
          rawToken,
        );
      } catch {
        // * Remove action token if email faild to send
        await this.prisma.memberActionToken.deleteMany({
          where: { id: actionToken.id },
        });

        throw new InternalServerErrorException(
          'We could not send a new password setup email. Please try logging in again later or contact your administrator if the problem continues.',
        );
      }

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

    // * Check status of account
    if (member.accountStatus === AccountStatus.PENDING) {
      throw new UnauthorizedException(
        'Your account is temporarily pending. Please contact your gym administrator to reactivate your membership.',
      );
    }

    if (member.accountStatus === AccountStatus.BANNED) {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact your gym administrator for assistance.',
      );
    }

    // * Generate Access Token
    const accessTokenPayload: AccessTokenPayload = {
      id: member.id,
      role: member.role,
    };
    const accessToken =
      await this.customJwtService.generateAccessToken(accessTokenPayload);

    // * Generate Refresh Token
    // * Generate UUID for jti
    const jti = randomUUID();

    const refreshTokenPayload: RefreshTokenPayload = {
      id: member.id,
      role: member.role,
      jti: jti,
    };
    const refreshToken =
      await this.customJwtService.generateRefreshToken(refreshTokenPayload);

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

    // * Exculde Some Fields

    // ! BLOCK_CHAINE
    const { password, admin, ...safeMember } = member;

    return {
      member: {
        ...safeMember,
        // ! BLOCK_CHAINE
        adminWalletAddress: admin.walletAddress,
      },
      accessToken,
      refreshToken,
      refreshExpiresIn,
    };
  }

  // * Set Password Member
  async setPasswordMember(rawToken: string, data: SetPasswordMemberDto) {
    // * Hash this raw token and check if exist in DB
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const token = await this.prisma.memberActionToken.findUnique({
      where: { tokenHash: tokenHash, type: ActionTokenType.SET_PASSWORD },
      include: { member: { select: privateMemberSelect } },
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
    await this.prisma.$transaction(async (tx) => {
      // * Set The Password
      const { count: countMember } = await tx.member.updateMany({
        where: {
          id: member.id,
          password: null,
        },
        data: {
          password: data.password,
        },
      });

      // * Another request already set the password
      if (countMember !== 1) {
        throw new BadRequestException('Member already has a password');
      }

      // * Make this token used
      const { count: countToken } = await tx.memberActionToken.updateMany({
        where: {
          id: token.id,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
          type: ActionTokenType.SET_PASSWORD,
        },
        data: {
          usedAt: new Date(),
        },
      });

      // * Another request already consumed it
      if (countToken !== 1) {
        throw new BadRequestException('Invalid or expired token');
      }

      // * Invalidate any other active SET_PASSWORD links
      await tx.memberActionToken.updateMany({
        where: {
          memberId: member.id,
          type: ActionTokenType.SET_PASSWORD,
          usedAt: null,
          id: {
            not: token.id,
          },
        },
        data: {
          usedAt: new Date(),
        },
      });
    });
  }

  // * Refresh
  async refresh(
    request: Request,
    refreshToken: string,
    refreshTokenPayload: RefreshTokenPayload,
  ) {
    // * Check if Refresh Token is already exist in DB
    const storedToken = await this.prisma.userRefreshToken.findUnique({
      where: { jti: refreshTokenPayload.jti },
      include: { user: { select: privateUserSelect } },
    });

    if (!storedToken) {
      throw new UnauthorizedException();
    }

    if (storedToken.userId !== refreshTokenPayload.id) {
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

    // * revok the old refresh token and Generate new one
    // *  Generate UUID for jti
    const jti = randomUUID();

    const newRefreshTokenPayload: RefreshTokenPayload = {
      id: storedToken.user.id,
      role: storedToken.user.role,
      jti: jti,
    };

    const newRefreshToken = await this.customJwtService.generateRefreshToken(
      newRefreshTokenPayload,
    );

    // * Hash Refresh Token
    const salt = await bcrypt.genSalt(10);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, salt);

    // * Save Hash Refresh Token in database
    // * Get refresh token expiration time from .env
    const refreshExpiresIn =
      storedToken.user.role === Role.ADMIN
        ? this.config.getOrThrow<StringValue>('JWT_ADMIN_REFRESH_EXPIRES_IN')
        : this.config.getOrThrow<StringValue>('JWT_OWNER_REFRESH_EXPIRES_IN');

    // * Calculate expiration date
    const expiresAt = new Date(Date.now() + ms(refreshExpiresIn));

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.userRefreshToken.updateMany({
        where: {
          id: storedToken.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          revokedAt: new Date(),
        },
      });

      // * Someone else already used this refresh token
      if (count !== 1) {
        throw new UnauthorizedException();
      }

      await tx.userRefreshToken.create({
        data: {
          jti: jti,
          hash: newRefreshTokenHash,
          user: { connect: { id: storedToken.user.id } },
          expiresAt: expiresAt,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          device: this.getDevice(request.headers['user-agent']),
        },
      });
    });

    // * generate new access token
    const accessTokenPayload: AccessTokenPayload = {
      id: storedToken.user.id,
      role: storedToken.user.role,
    };
    const accessToken =
      await this.customJwtService.generateAccessToken(accessTokenPayload);

    return { accessToken, newRefreshToken, refreshExpiresIn };
  }

  // * Refresh Staff
  async refreshStaff(
    request: Request,
    refreshToken: string,
    refreshTokenPayload: RefreshTokenPayload,
  ) {
    // * Check if Refresh Token is already exist in DB
    const storedToken = await this.prisma.staffRefreshToken.findUnique({
      where: { jti: refreshTokenPayload.jti },
      include: { staff: { select: privateStaffSelect } },
    });

    if (!storedToken) {
      throw new UnauthorizedException();
    }

    if (storedToken.staffId !== refreshTokenPayload.id) {
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
    if (storedToken.staff.accountStatus !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    // * Verify the user type
    if (storedToken.staff.role !== Role.STAFF) {
      throw new UnauthorizedException();
    }

    // * revok the old refresh token and Generate new one
    // *  Generate UUID for jti
    const jti = randomUUID();

    const newRefreshTokenPayload: RefreshTokenPayload = {
      id: storedToken.staff.id,
      role: storedToken.staff.role,
      jti: jti,
    };

    const newRefreshToken = await this.customJwtService.generateRefreshToken(
      newRefreshTokenPayload,
    );

    // * Hash Refresh Token
    const salt = await bcrypt.genSalt(10);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, salt);

    // * Save Hash Refresh Token in database
    // * Get refresh token expiration time from .env
    const refreshExpiresIn = this.config.getOrThrow<StringValue>(
      'JWT_STAFF_REFRESH_EXPIRES_IN',
    );

    // * Calculate expiration date
    const expiresAt = new Date(Date.now() + ms(refreshExpiresIn));

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.staffRefreshToken.updateMany({
        where: {
          id: storedToken.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          revokedAt: new Date(),
        },
      });

      // * Someone else already used this refresh token
      if (count !== 1) {
        throw new UnauthorizedException();
      }

      await tx.staffRefreshToken.create({
        data: {
          jti: jti,
          hash: newRefreshTokenHash,
          staff: { connect: { id: storedToken.staff.id } },
          expiresAt: expiresAt,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          device: this.getDevice(request.headers['user-agent']),
        },
      });
    });

    // * generate new access token
    const accessTokenPayload: AccessTokenPayload = {
      id: storedToken.staff.id,
      role: storedToken.staff.role,
    };
    const accessToken =
      await this.customJwtService.generateAccessToken(accessTokenPayload);

    return { accessToken, newRefreshToken, refreshExpiresIn };
  }

  // * Refresh Member
  async refreshMember(
    request: Request,
    refreshToken: string,
    refreshTokenPayload: RefreshTokenPayload,
  ) {
    // * Check if Refresh Token is already exist in DB
    const storedToken = await this.prisma.memberRefreshToken.findUnique({
      where: { jti: refreshTokenPayload.jti },
      include: { member: { select: privateMemberSelect } },
    });

    if (!storedToken) {
      throw new UnauthorizedException();
    }

    if (storedToken.memberId !== refreshTokenPayload.id) {
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
    if (storedToken.member.accountStatus !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    // * Verify the user type
    if (storedToken.member.role !== Role.MEMBER) {
      throw new UnauthorizedException();
    }

    // * revok the old refresh token and Generate new one
    // *  Generate UUID for jti
    const jti = randomUUID();

    const newRefreshTokenPayload: RefreshTokenPayload = {
      id: storedToken.member.id,
      role: storedToken.member.role,
      jti: jti,
    };

    const newRefreshToken = await this.customJwtService.generateRefreshToken(
      newRefreshTokenPayload,
    );

    // * Hash Refresh Token
    const salt = await bcrypt.genSalt(10);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, salt);

    // * Save Hash Refresh Token in database
    // * Get refresh token expiration time from .env
    const refreshExpiresIn = this.config.getOrThrow<StringValue>(
      'JWT_MEMBER_REFRESH_EXPIRES_IN',
    );

    // * Calculate expiration date
    const expiresAt = new Date(Date.now() + ms(refreshExpiresIn));

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.memberRefreshToken.updateMany({
        where: {
          id: storedToken.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          revokedAt: new Date(),
        },
      });

      // * Someone else already used this refresh token
      if (count !== 1) {
        throw new UnauthorizedException();
      }

      await tx.memberRefreshToken.create({
        data: {
          jti: jti,
          hash: newRefreshTokenHash,
          member: { connect: { id: storedToken.member.id } },
          expiresAt: expiresAt,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          device: this.getDevice(request.headers['user-agent']),
        },
      });
    });

    // * generate new access token
    const accessTokenPayload: AccessTokenPayload = {
      id: storedToken.member.id,
      role: storedToken.member.role,
    };
    const accessToken =
      await this.customJwtService.generateAccessToken(accessTokenPayload);

    return { accessToken, newRefreshToken, refreshExpiresIn };
  }

  // * Activate user account
  async activateAccount(rawToken: string) {
    // * Hash this raw token and check if exist in DB
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const token = await this.prisma.userActionToken.findUnique({
      where: { tokenHash: tokenHash, type: ActionTokenType.EMAIL_VERIFICATION },
      include: { user: { select: privateUserSelect } },
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

    // * Check if user already veryfied his account
    if (token.user.isAccountVerified) {
      throw new BadRequestException('Account Already Activated');
    }

    // * A Prisma transaction is a mechanism that executes multiple database operations as a single atomic unit,
    // * ensuring that either all operations succeed and are committed, or if any operation fails,
    // * all previous operations are rolled back, leaving the database unchanged.
    await this.prisma.$transaction(async (tx) => {
      // * Atomically consume EMAIL_VERIFICATION token
      const { count: countToken } = await tx.userActionToken.updateMany({
        where: {
          id: token.id,
          userId: token.user.id,
          type: ActionTokenType.EMAIL_VERIFICATION,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          usedAt: new Date(),
        },
      });

      // * Another request already consumed or expired the token
      if (countToken !== 1) {
        throw new BadRequestException('Invalid or expired token');
      }

      // * Verify account only if it is still unverified
      const { count: countUser } = await tx.user.updateMany({
        where: {
          id: token.user.id,
          isAccountVerified: false,
        },
        data: {
          isAccountVerified: true,
        },
      });

      if (countUser !== 1) {
        throw new BadRequestException('Account already verified');
      }

      // * Invalidate all other active EMAIL_VERIFICATION links
      await tx.userActionToken.updateMany({
        where: {
          userId: token.user.id,
          type: ActionTokenType.EMAIL_VERIFICATION,
          usedAt: null,
          id: {
            not: token.id,
          },
        },
        data: {
          usedAt: new Date(),
        },
      });
    });
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

    // * Check whether a valid verification token already exists.
    const existingToken = await this.prisma.userActionToken.findFirst({
      where: {
        userId: user.id,
        type: ActionTokenType.RESET_PASSWORD,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingToken) {
      throw new UnauthorizedException(
        'A reset password email has already been requested. Please check your inbox.',
      );
    }

    // * Send Email of reset password to user
    // * Generate Token
    const { rawToken, tokenHash } = generateActionToken();

    // * Calc the expir
    const resetPasswordTokenExpireIn = this.config.getOrThrow<StringValue>(
      'RESET_PASSWORD_TOKEN_EXPIRES_IN',
    );
    const expiresAt = new Date(Date.now() + ms(resetPasswordTokenExpireIn));

    // * Store the hash Token in DB
    const actionToken = await this.prisma.userActionToken.create({
      data: {
        user: { connect: { id: user.id } },
        tokenHash: tokenHash,
        type: ActionTokenType.RESET_PASSWORD,
        expiresAt: expiresAt,
      },
    });

    try {
      // * Send email
      await this.emailService.sendResetPasswordEmail(email, rawToken);
    } catch {
      // * Remove action token if email faild to send
      await this.prisma.userActionToken.deleteMany({
        where: { id: actionToken.id },
      });

      throw new InternalServerErrorException(
        'We could not send the password reset email. Please try again later or contact support if the problem continues.',
      );
    }
    return {
      message: 'Please check your email and set your password.',
    };
  }

  // * Password reset
  async resetPassword(rawToken: string, password: string) {
    // * Hash this raw token and check if exist in DB
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const token = await this.prisma.userActionToken.findUnique({
      where: { tokenHash: tokenHash, type: ActionTokenType.RESET_PASSWORD },
      include: { user: { select: privateUserSelect } },
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

    // * Hash new Password
    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(password, salt);

    // * A Prisma transaction is a mechanism that executes multiple database operations as a single atomic unit,
    // * ensuring that either all operations succeed and are committed, or if any operation fails,
    // * all previous operations are rolled back, leaving the database unchanged.
    await this.prisma.$transaction(async (tx) => {
      // * Atomically consume RESET_PASSWORD token
      const { count: countToken } = await tx.userActionToken.updateMany({
        where: {
          id: token.id,
          userId: token.user.id,
          type: ActionTokenType.RESET_PASSWORD,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          usedAt: new Date(),
        },
      });

      // * Another request already consumed or expired this token
      if (countToken !== 1) {
        throw new BadRequestException('Invalid or expired token');
      }

      // * Save new password
      await tx.user.update({
        where: {
          id: token.user.id,
        },
        data: {
          password: newPassword,
        },
      });

      // * Invalidate all other active RESET_PASSWORD tokens
      await tx.userActionToken.updateMany({
        where: {
          userId: token.user.id,
          type: ActionTokenType.RESET_PASSWORD,
          usedAt: null,
          id: {
            not: token.id,
          },
        },
        data: {
          usedAt: new Date(),
        },
      });

      // * Logout all existing sessions
      await tx.userRefreshToken.updateMany({
        where: {
          userId: token.user.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    });
  }

  // * Email Change
  async emailChange(rawToken: string) {
    // * Hash raw token
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const token = await this.prisma.userActionToken.findUnique({
      where: {
        tokenHash,
        type: ActionTokenType.EMAIL_CHANGE,
        pendingEmail: {
          not: null,
        },
      },
      include: {
        user: {
          select: privateUserSelect,
        },
      },
    });

    if (!token) {
      throw new BadRequestException('Invalid token');
    }

    // * Check if token is already used
    if (token.usedAt) {
      throw new BadRequestException('Token already used');
    }

    // * Check if token is expired
    if (token.expiresAt < new Date()) {
      throw new BadRequestException('Token expired');
    }

    // * Make sure pending email exists
    if (!token.pendingEmail) {
      throw new BadRequestException('Invalid pending email');
    }

    // * Get pending email from token
    const pendingEmail = token.pendingEmail;

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // * Atomically consume EMAIL_CHANGE token
      const { count } = await tx.userActionToken.updateMany({
        where: {
          id: token.id,
          userId: token.user.id,
          type: ActionTokenType.EMAIL_CHANGE,
          pendingEmail,
          usedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          usedAt: now,
        },
      });

      // * Another request already consumed or expired this token
      if (count !== 1) {
        throw new BadRequestException('Invalid or expired token');
      }

      // * Save new email
      await tx.user.update({
        where: {
          id: token.user.id,
        },
        data: {
          email: pendingEmail,
        },
      });

      // * Invalidate all other active EMAIL_CHANGE tokens
      await tx.userActionToken.updateMany({
        where: {
          userId: token.user.id,
          type: ActionTokenType.EMAIL_CHANGE,
          usedAt: null,
          id: {
            not: token.id,
          },
        },
        data: {
          usedAt: now,
        },
      });
    });
  }

  // * Forgot password (Member)
  async forgotPasswordMember(username: string) {
    // * Check if member already exist by username
    const member = await this.prisma.member.findUnique({
      where: { userName: username },
    });
    if (!member) {
      throw new NotFoundException('Member Not Found');
    }

    // * Check whether a valid verification token already exists.
    const existingToken = await this.prisma.memberActionToken.findFirst({
      where: {
        memberId: member.id,
        type: ActionTokenType.RESET_PASSWORD,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingToken) {
      throw new UnauthorizedException(
        'A reset password email has already been requested. Please check your inbox.',
      );
    }

    // * Send Email of reset password to member
    // * Generate Action Token
    const { rawToken, tokenHash } = generateActionToken();

    // * Calc the expir
    const resetPasswordTokenExpireIn = this.config.getOrThrow<StringValue>(
      'RESET_PASSWORD_TOKEN_EXPIRES_IN',
    );
    const expiresAt = new Date(Date.now() + ms(resetPasswordTokenExpireIn));

    // * Store the hash Token in DB
    const actionToken = await this.prisma.memberActionToken.create({
      data: {
        member: { connect: { id: member.id } },
        tokenHash: tokenHash,
        type: ActionTokenType.RESET_PASSWORD,
        expiresAt: expiresAt,
      },
    });

    try {
      // * Send email
      await this.emailService.sendResetPasswordMemberEmail(
        member.email,
        rawToken,
      );
    } catch {
      // * Remove action token if email faild to send
      await this.prisma.memberActionToken.deleteMany({
        where: { id: actionToken.id },
      });

      throw new InternalServerErrorException(
        'We could not send the password reset email. Please try again later or contact your administrator if the problem continues.',
      );
    }

    return {
      message: 'Please check your email and set your password.',
    };
  }

  // * Password reset (Member)
  async resetPasswordMember(rawToken: string, password: string) {
    // * Hash this raw token and check if exist in DB
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const token = await this.prisma.memberActionToken.findUnique({
      where: { tokenHash: tokenHash, type: ActionTokenType.RESET_PASSWORD },
      include: { member: { select: privateMemberSelect } },
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

    // * Hash new Password
    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(password, salt);

    // * A Prisma transaction is a mechanism that executes multiple database operations as a single atomic unit,
    // * ensuring that either all operations succeed and are committed, or if any operation fails,
    // * all previous operations are rolled back, leaving the database unchanged.
    await this.prisma.$transaction(async (tx) => {
      // * Atomically consume this RESET_PASSWORD token
      const { count: countToken } = await tx.memberActionToken.updateMany({
        where: {
          id: token.id,
          memberId: member.id,
          type: ActionTokenType.RESET_PASSWORD,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          usedAt: new Date(),
        },
      });

      // * Another request already consumed or expired this token
      if (countToken !== 1) {
        throw new BadRequestException('Invalid or expired token');
      }

      // * Save new password
      await tx.member.update({
        where: {
          id: member.id,
        },
        data: {
          password: newPassword,
        },
      });

      // * Invalidate all other active RESET_PASSWORD tokens
      await tx.memberActionToken.updateMany({
        where: {
          memberId: member.id,
          type: ActionTokenType.RESET_PASSWORD,
          usedAt: null,
          id: {
            not: token.id,
          },
        },
        data: {
          usedAt: new Date(),
        },
      });

      // * Logout all existing sessions
      await tx.memberRefreshToken.updateMany({
        where: {
          memberId: member.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    });
  }

  // * Email Change (Member)
  async emailChangeMember(rawToken: string) {
    // * Hash raw token
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const token = await this.prisma.memberActionToken.findUnique({
      where: {
        tokenHash,
        type: ActionTokenType.EMAIL_CHANGE,
        pendingEmail: {
          not: null,
        },
      },
      include: {
        member: {
          select: privateMemberSelect,
        },
      },
    });

    if (!token) {
      throw new BadRequestException('Invalid token');
    }

    // * Check if token is already used
    if (token.usedAt) {
      throw new BadRequestException('Token already used');
    }

    // * Check if token is expired
    if (token.expiresAt < new Date()) {
      throw new BadRequestException('Token expired');
    }

    // * Make sure pending email exists
    if (!token.pendingEmail) {
      throw new BadRequestException('Invalid pending email');
    }

    // * Get pending email from token
    const pendingEmail = token.pendingEmail;

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // * Atomically consume EMAIL_CHANGE token
      const { count } = await tx.memberActionToken.updateMany({
        where: {
          id: token.id,
          memberId: token.member.id,
          type: ActionTokenType.EMAIL_CHANGE,
          pendingEmail,
          usedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          usedAt: now,
        },
      });

      // * Another request already consumed or expired this token
      if (count !== 1) {
        throw new BadRequestException('Invalid or expired token');
      }

      // * Save new email
      await tx.member.update({
        where: {
          id: token.member.id,
        },
        data: {
          email: pendingEmail,
        },
      });

      // * Invalidate all other active EMAIL_CHANGE tokens
      await tx.memberActionToken.updateMany({
        where: {
          memberId: token.member.id,
          type: ActionTokenType.EMAIL_CHANGE,
          usedAt: null,
          id: {
            not: token.id,
          },
        },
        data: {
          usedAt: now,
        },
      });
    });
  }

  // ! Private
  // * Get Device by UA
  private getDevice(userAgent?: string): string | null {
    if (!userAgent) return null;

    const parser = new UAParser(userAgent);

    const result = parser.getResult();

    return `${result.device.vendor ?? 'Unknown'} ${result.device.model ?? 'Desktop'}`;
  }
}
