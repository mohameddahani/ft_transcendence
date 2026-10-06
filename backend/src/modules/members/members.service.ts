import { PrismaService } from '@/infrastructure/database/prisma.service';
import { AddMemberDto } from './dtos/add-member.dto';
import { generateUsername } from '@/core/utils/generate-username';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ActionTokenType,
  MembershipStatus,
  MemberAccountStatus,
  PaymentStatus,
  Role,
} from '@/generated/prisma/enums';
import { UpdateMemberDto } from './dtos/update-member.dto';
import { EmailService } from '@/infrastructure/email/email.service';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';
import { generateActionToken } from '@/core/utils/generate-action-token';
import { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { AccessesService } from '@/core/services/access.service';
import { addDays } from 'date-fns';
import {
  DEFAULT_AVATARS,
  DEFAULT_AVATARS_ID,
} from '@/core/constants/default-avatars.constants';

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
    private readonly accessesService: AccessesService,
  ) {}

  // * Add Member by Admin or Staff
  async addMember(accessTokenPayload: AccessTokenPayload, data: AddMemberDto) {
    // * Check Authorize Admin or Staff Access
    const { adminId, subscription } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    // * Check if admin has place for new member
    // * Count Members
    const membersCount = await this.prisma.member.count({
      where: {
        adminId,
      },
    });
    if (membersCount >= subscription.plan.maxMembers) {
      throw new ForbiddenException(
        `You have reached the maximum number of members allowed by your current plan (${subscription.plan.maxMembers}). Please upgrade your subscription to add more members.`,
      );
    }

    // * Check if Admin Has Membership Plan With Duration
    const { duration, membershipPlan } =
      await this.checkIfAdminHasMembershipPlanWithDuration(
        adminId,
        data.membershipPlanId,
        data.membershipPlanDurationId,
      );

    // * Check if memberhsip Plan is active
    if (!membershipPlan.isActive) {
      throw new ConflictException(
        'The selected membership plan is no longer available. Please choose another active membership plan.',
      );
    }

    // * Check if member already exist
    const existingMember = await this.prisma.member.findFirst({
      where: {
        adminId: adminId,
        OR: [{ email: data.email }, { phoneNumber: data.phoneNumber }],
      },
    });
    if (existingMember) {
      if (existingMember.email === data.email) {
        throw new ConflictException('Email already exists');
      }

      if (existingMember.phoneNumber === data.phoneNumber) {
        throw new ConflictException('Phone number already exists');
      }
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
      const existingUserName = await this.prisma.member.findUnique({
        where: {
          userName: userName,
        },
      });
      if (!existingUserName) {
        break;
      }
    }

    // * Interactive transaction (function)
    // * tx is the prisma client inside a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // * Add members to database
      const member = await tx.member.create({
        data: {
          admin: { connect: { id: adminId } },
          staff:
            accessTokenPayload.role === Role.STAFF
              ? { connect: { id: accessTokenPayload.id } }
              : undefined, // Ignore this field. Don't do anything with staff.
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          birthDate: data.birthDate,
          userName: userName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          profileImageUrl: DEFAULT_AVATARS.MEMBER,
          profileImagePublicId: DEFAULT_AVATARS_ID.MEMBER,
          address: data.address,
          emergencyContact: data.emergencyContact,
        },
      });
      // * Add Membership of member
      const expiresAt = addDays(new Date(), duration.durationDays);
      const membership = await tx.membership.create({
        data: {
          admin: { connect: { id: adminId } },
          member: { connect: { id: member.id } },
          membershipPlan: { connect: { id: data.membershipPlanId } },
          membershipPlanDuration: {
            connect: { id: data.membershipPlanDurationId },
          },
          expiresAt: expiresAt,
        },
        include: {
          membershipPlanDuration: true,
        },
      });

      // * Add Payment of Member
      await tx.payment.create({
        data: {
          member: { connect: { id: member.id } },
          admin: { connect: { id: adminId } },
          amount: membership.membershipPlanDuration.price,
          paidAt: membership.startDate,
          dueDate: membership.expiresAt,
          paymentStatus: PaymentStatus.PAID,
        },
      });

      return member;
    });

    // * Send Email of Set password to member
    try {
      // * Generate Action Token
      const { rawToken, tokenHash } = generateActionToken();

      // * Calc the expir
      const setPasswordTokenExpiresIn = this.config.getOrThrow<StringValue>(
        'SET_PASSWORD_TOKEN_EXPIRES_IN',
      );
      const expiresAt = new Date(Date.now() + ms(setPasswordTokenExpiresIn));

      // * Store the hash Token in DB
      await this.prisma.memberActionToken.create({
        data: {
          member: { connect: { id: result.id } },
          tokenHash: tokenHash,
          type: ActionTokenType.SET_PASSWORD,
          expiresAt: expiresAt,
        },
      });

      // * Send email of Password Set to member
      await this.emailService.sendSetPasswordMemberEmail(
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

  // * Update data of member
  async update(
    accessTokenPayload: AccessTokenPayload,
    memberId: string,
    data: UpdateMemberDto,
  ) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    // * Check if we have member already in DB
    await this.findOne(accessTokenPayload, memberId);

    // * Check if member data duplicate
    const existingData = await this.prisma.member.findFirst({
      where: {
        id: {
          not: memberId,
        },
        adminId: adminId,
        OR: [{ email: data.email }, { phoneNumber: data.phoneNumber }],
      },
    });

    if (existingData) {
      if (existingData.email === data.email) {
        // * 409 = duplicate data
        throw new ConflictException('Email already exists');
      }

      if (existingData.phoneNumber === data.phoneNumber) {
        // * 409 = duplicate data
        throw new ConflictException('Phone number already exists');
      }
    }

    // * Save new data to member
    await this.prisma.member.update({
      where: {
        id: memberId,
        adminId: adminId,
      },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        birthDate: data.birthDate,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address: data.address,
        emergencyContact: data.emergencyContact,
      },
    });

    // * check if the admin update the membership plan
    if (data.membershipPlanId && data.membershipPlanDurationId) {
      // * Check if Admin Has Membership Plan With Duration
      const { duration, membershipPlan } =
        await this.checkIfAdminHasMembershipPlanWithDuration(
          adminId,
          data.membershipPlanId,
          data.membershipPlanDurationId,
        );

      // * Check if memberhsip Plan is active
      if (!membershipPlan.isActive) {
        throw new ConflictException(
          'The selected membership plan is no longer available. Please choose another active membership plan.',
        );
      }

      // * Check Membership Before update
      const membership = await this.prisma.membership.findFirst({
        where: {
          adminId: adminId,
          memberId: memberId,
          membershipStatus: MemberAccountStatus.ACTIVE,
        },
      });
      if (!membership) {
        throw new NotFoundException('Membership Not Found!');
      }

      // * Check if the new membership is duplicate or already active
      if (
        data.membershipPlanId === membership.membershipPlanId &&
        data.membershipPlanDurationId === membership.membershipPlanDurationId &&
        membership.membershipStatus === MembershipStatus.ACTIVE
      ) {
        throw new ConflictException(
          'This member already has an active membership with the same plan and duration.',
        );
      }

      // * Interactive transaction (function)
      // * tx is the prisma client inside a transaction
      await this.prisma.$transaction(async (tx) => {
        // * make old membership expired
        await tx.membership.update({
          where: { id: membership.id },
          data: { membershipStatus: MembershipStatus.EXPIRED },
        });

        // * Add new Membership to member
        const expiresAt = addDays(new Date(), duration.durationDays);
        const newMembership = await this.prisma.membership.create({
          data: {
            admin: { connect: { id: adminId } },
            member: { connect: { id: memberId } },
            membershipPlan: { connect: { id: data.membershipPlanId } },
            membershipPlanDuration: {
              connect: { id: data.membershipPlanDurationId },
            },
            expiresAt: expiresAt,
          },
          include: { membershipPlan: true, membershipPlanDuration: true },
        });

        // * Add New Payment for Updated Member
        await tx.payment.create({
          data: {
            member: { connect: { id: newMembership.memberId } },
            admin: { connect: { id: adminId } },
            amount: newMembership.membershipPlanDuration.price,
            paidAt: newMembership.startDate,
            dueDate: newMembership.expiresAt,
            paymentStatus: PaymentStatus.PAID,
          },
        });
      });
    } else if (
      (data.membershipPlanId && !data.membershipPlanDurationId) ||
      (!data.membershipPlanId && data.membershipPlanDurationId)
    ) {
      throw new BadRequestException(
        'membership plan and duration must be provided together.',
      );
    }
  }

  // * Active a Member
  async activeMember(accessTokenPayload: AccessTokenPayload, memberId: string) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    // * Check member is exist
    const member = await this.findOne(accessTokenPayload, memberId);
    if (member.accountStatus === MemberAccountStatus.ACTIVE) {
      throw new ConflictException('The Member is already Active!');
    }

    return await this.prisma.member.update({
      where: {
        id: memberId,
        adminId: adminId,
      },
      data: {
        accountStatus: MemberAccountStatus.ACTIVE,
      },
    });
  }

  // * Freeze a Member
  async freezeMember(accessTokenPayload: AccessTokenPayload, memberId: string) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    // * Check member exists
    const member = await this.findOne(accessTokenPayload, memberId);

    if (member.accountStatus === MemberAccountStatus.FROZEN) {
      throw new ConflictException('The member is already frozen.');
    }

    if (member.accountStatus === MemberAccountStatus.BANNED) {
      throw new ConflictException(
        'A banned member cannot be frozen. Active the member first.',
      );
    }

    return await this.prisma.member.update({
      where: {
        id: memberId,
        adminId: adminId,
      },
      data: {
        accountStatus: MemberAccountStatus.FROZEN,
      },
    });
  }

  // * Ban a Member
  async banMember(accessTokenPayload: AccessTokenPayload, memberId: string) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    // * Check member exists
    const member = await this.findOne(accessTokenPayload, memberId);

    if (member.accountStatus === MemberAccountStatus.BANNED) {
      throw new ConflictException('The member is already banned.');
    }

    return await this.prisma.member.update({
      where: {
        id: memberId,
        adminId: adminId,
      },
      data: {
        accountStatus: MemberAccountStatus.BANNED,
      },
    });
  }

  // * Resend Set Password for member
  async resendSetPasswordMember(
    accessTokenPayload: AccessTokenPayload,
    memberId: string,
  ) {
    // * Check Authorize Admin or Staff Access
    await this.accessesService.authorizeAdminOrStaffAccess(accessTokenPayload);

    // * Check member exists
    const member = await this.findOne(accessTokenPayload, memberId);

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
        'A set password email has already been requested. Please check inbox of member.',
      );
    }

    // * Send Email of Set password to member
    try {
      // * Generate Action Token
      const { rawToken, tokenHash } = generateActionToken();

      // * Calc the expir
      const setPasswordTokenExpiresIn = this.config.getOrThrow<StringValue>(
        'SET_PASSWORD_TOKEN_EXPIRES_IN',
      );
      const expiresAt = new Date(Date.now() + ms(setPasswordTokenExpiresIn));

      // * Store the hash Token in DB
      await this.prisma.memberActionToken.create({
        data: {
          member: { connect: { id: member.id } },
          tokenHash: tokenHash,
          type: ActionTokenType.SET_PASSWORD,
          expiresAt: expiresAt,
        },
      });

      // * Send email of Password Set to member
      await this.emailService.sendSetPasswordMemberEmail(
        member.userName,
        member.email,
        rawToken,
      );
    } catch {
      throw new RequestTimeoutException(
        'Failed to send set password of member email',
      );
    }
  }

  // * Get all Members
  async findAll(
    accessTokenPayload: AccessTokenPayload,
    page: number,
    limit: number,
  ) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    const members = await this.prisma.member.findMany({
      where: {
        adminId,
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        adminId: true,
        firstName: true,
        lastName: true,
        gender: true,
        birthDate: true,
        userName: true,
        email: true,
        phoneNumber: true,
        profileImageUrl: true,
        address: true,
        emergencyContact: true,
        role: true,
        accountStatus: true,
        memberships: true,
        payments: true,
        notifications: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (members.length === 0) {
      throw new NotFoundException('Members Not Found!');
    }

    return members;
  }

  // * Get one Member
  async findOne(accessTokenPayload: AccessTokenPayload, memberId: string) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

    const member = await this.prisma.member.findFirst({
      where: {
        adminId,
        id: memberId,
      },
      select: {
        id: true,
        adminId: true,
        firstName: true,
        lastName: true,
        gender: true,
        birthDate: true,
        userName: true,
        email: true,
        phoneNumber: true,
        profileImageUrl: true,
        address: true,
        emergencyContact: true,
        role: true,
        accountStatus: true,
        memberships: true,
        payments: true,
        notifications: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!member) {
      throw new NotFoundException('Member Not Found!');
    }

    return member;
  }

  // ! Private Attributes
  // * Check if Admin Has Membership Plan With Duration
  private async checkIfAdminHasMembershipPlanWithDuration(
    adminId: string,
    membershipPlanId: string,
    durationId: string,
  ) {
    // * Check if the admin has this membership plan
    const membershipPlan = await this.prisma.membershipPlan.findFirst({
      where: {
        adminId: adminId,
        id: membershipPlanId,
      },
    });
    if (!membershipPlan) {
      throw new NotFoundException(
        'There is No Membership Plan, Please Add a Membership Plan',
      );
    }

    // * Check if duration is already exist for this membership plan
    const duration = await this.prisma.membershipPlanDuration.findFirst({
      where: {
        id: durationId,
        membershipPlan: { adminId: adminId },
        membershipPlanId: membershipPlan.id,
      },
    });
    if (!duration) {
      throw new NotFoundException('Duration does not exist for this plan');
    }

    return { duration, membershipPlan };
  }
}
