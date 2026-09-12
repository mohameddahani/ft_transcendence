import { PrismaService } from '@/infrastructure/database/prisma.service';
import { EmailService } from '@/infrastructure/email/email.service';
import {
  Injectable,
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
}
