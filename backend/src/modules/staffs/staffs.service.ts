import { PrismaService } from '@/infrastructure/database/prisma.service';
import { EmailService } from '@/infrastructure/email/email.service';
import {
  Injectable,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AddStaffDto } from './dtos/add-staff.dto';
import { ActionTokenType } from '@/generated/prisma/enums';
import { generateUsername } from '@/core/utils/generate-username';
import ms, { StringValue } from 'ms';
import { generateActionToken } from '@/core/utils/generate-action-token';
import { SubscriptionsService } from '../platform/subscriptions/subscriptions.service';

@Injectable()
export class StaffsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // * Add Staff by Admin
  async addStaff(adminId: string, data: AddStaffDto) {
    // * Check if admin is has already a subscription
    const subscription =
      await this.subscriptionsService.checkIfAdminHasSubscription(adminId);

    // * Check if staff already exist
    const existingStaff = await this.prisma.staff.findFirst({
      where: {
        adminId: adminId,
        OR: [{ email: data.email }, { phoneNumber: data.phoneNumber }],
      },
    });
    if (existingStaff) {
      if (existingStaff.email === data.email) {
        throw new UnauthorizedException('Email already exists');
      }

      if (existingStaff.phoneNumber === data.phoneNumber) {
        throw new UnauthorizedException('Phone number already exists');
      }
    }

    // * Genarate a userName
    let userName: string;
    while (true) {
      userName = generateUsername(data.firstName, data.lastName);

      // * Check if username already exist before register
      const existingUserName = await this.prisma.staff.findUnique({
        where: {
          userName: userName,
        },
      });
      if (!existingUserName) {
        break;
      }
    }

    // * Add staff to database
    const result = await this.prisma.staff.create({
      data: {
        admin: { connect: { id: adminId } },
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        birthDate: data.birthDate,
        userName: userName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        companyName: subscription.user.companyName,
      },
    });

    // * Send Email of Set password to Staff
    try {
      // * Generate Action Token
      const { rawToken, tokenHash } = generateActionToken();

      // * Calc the expir
      const setPasswordTokenExpiresIn = this.config.getOrThrow<StringValue>(
        'SET_PASSWORD_TOKEN_EXPIRES_IN',
      );
      const expiresAt = new Date(Date.now() + ms(setPasswordTokenExpiresIn));

      // * Store the hash Token in DB
      await this.prisma.staffActionToken.create({
        data: {
          staff: { connect: { id: result.id } },
          tokenHash: tokenHash,
          type: ActionTokenType.SET_PASSWORD,
          expiresAt: expiresAt,
        },
      });

      // * Send email of Password Set to staff
      await this.emailService.sendSetPasswordEmail(
        result.userName,
        result.email,
        rawToken,
      );
    } catch {
      throw new RequestTimeoutException(
        'Failed to send set password of member email',
      );
    }
  }

  // * Get All Staffs
  async findAll(adminId: string, page: number, limit: number) {
    // * Check if admin is has already a subscription
    await this.subscriptionsService.checkIfAdminHasSubscription(adminId);

    const staffs = await this.prisma.staff.findMany({
      where: {
        adminId,
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
        admin: true,
        role: true,
        profileImageUrl: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (staffs.length === 0) {
      throw new NotFoundException('Staffs Not Found!');
    }

    return staffs;
  }

  // * Get One Staff
  async findOne(adminId: string, staffId: string) {
    // * Check if admin is has already a subscription
    await this.subscriptionsService.checkIfAdminHasSubscription(adminId);

    const staff = await this.prisma.staff.findFirst({
      where: {
        adminId,
        id: staffId,
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
        admin: true,
        role: true,
        profileImageUrl: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!staff) {
      throw new NotFoundException('Staff Not Found!');
    }

    return staff;
  }
}
