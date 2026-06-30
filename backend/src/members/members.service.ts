import { PrismaService } from '@/prisma/prisma.service';
import { AddMemberDto } from '@/members/dtos/add-member.dto';
import { generateUsername } from '@/utils/generate-username';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentStatus, SubscriptionStatus } from '@/generated/prisma/enums';
import { UpdateMemberDto } from './dtos/update-member.dto';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  // * Add Member by Admin
  async addMember(adminId: string, data: AddMemberDto) {
    // * Check if admin is has already a subscription
    const subscription = await this.checkIfAdminHasSubscription(adminId);

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
    const duration = await this.checkIfAdminHasMembershipPlanWithDuration(
      adminId,
      data.membershipPlanId,
      data.durationId,
    );

    // * Check if member already exist
    const existingMember = await this.prisma.member.findFirst({
      where: {
        adminId: adminId,
        OR: [{ email: data.email }, { phoneNumber: data.phoneNumber }],
      },
    });
    if (existingMember) {
      if (existingMember.email === data.email) {
        throw new UnauthorizedException('Email already exists');
      }

      if (existingMember.phoneNumber === data.phoneNumber) {
        throw new UnauthorizedException('Phone number already exists');
      }
    }

    // * Genarate a userName
    let userName: string;
    while (true) {
      userName = generateUsername(data.firstName, data.lastName);

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

    // * Add members to database
    const expiresAt = new Date(); // ex: 2026-06-19 20:30:15
    expiresAt.setDate(expiresAt.getDate() + duration.durationDays); // 19 + 30 => July 19th
    const member = await this.prisma.member.create({
      data: {
        admin: { connect: { id: adminId } },
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        birthDate: data.birthDate,
        userName: userName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address: data.address,
        emergencyContact: data.emergencyContact,
        membership: {
          connect: { id: data.membershipPlanId },
        },
        membershipPlanDuration: { connect: { id: duration.id } },
        expiresAt: expiresAt,
      },
      include: {
        membershipPlanDuration: true,
      },
    });
    if (!member) {
      throw new BadRequestException('Somthing Went Wrong');
    }

    // * Add Payment of Member
    await this.prisma.payment.create({
      data: {
        member: { connect: { id: member.id } },
        adminId: adminId,
        amount: member.membershipPlanDuration.price,
        paidAt: member.startDate,
        dueDate: member.expiresAt,
        status: PaymentStatus.PAID,
        note: data.note,
      },
    });
  }

  // * Update data of member
  async update(adminId: string, memberId: string, data: UpdateMemberDto) {
    // * Check if we have member already in DB
    await this.findOne(adminId, memberId);

    // * Check if member update
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

    // * check if the admin update the membership plan
    if (data.membershipPlanId && data.durationId) {
      // * Check if Admin Has Membership Plan With Duration
      const duration = await this.checkIfAdminHasMembershipPlanWithDuration(
        adminId,
        data.membershipPlanId,
        data.durationId,
      );

      const expiresAt = new Date(); // ex: 2026-06-19 20:30:15
      expiresAt.setDate(expiresAt.getDate() + duration.durationDays); // 19 + 30 => July 19th

      // * Save new data to member
      const updatedMember = await this.prisma.member.update({
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
          membership: {
            connect: { id: data.membershipPlanId },
          },
          membershipPlanDuration: { connect: { id: duration.id } },
          startDate: new Date(),
          expiresAt: expiresAt,
        },
        include: {
          membershipPlanDuration: true,
        },
      });

      // * Add New Payment for Updated Member
      await this.prisma.payment.create({
        data: {
          member: { connect: { id: updatedMember.id } },
          adminId: adminId,
          amount: updatedMember.membershipPlanDuration.price,
          paidAt: updatedMember.startDate,
          dueDate: updatedMember.expiresAt,
          status: PaymentStatus.PAID,
          note: data.note,
        },
      });
    } else if (
      (data.membershipPlanId && !data.durationId) ||
      (!data.membershipPlanId && data.durationId)
    ) {
      throw new BadRequestException(
        'membership plan and duration must be provided together.',
      );
    } else {
      // * Save new data to member
      await this.prisma.member.update({
        where: {
          id: memberId,
          adminId: adminId,
        },
        data,
      });
    }
  }

  // * Get all Members
  async findAll(adminId: string, page: number, limit: number) {
    // * Check if admin is has already a subscription
    await this.checkIfAdminHasSubscription(adminId);

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
        photo: true,
        address: true,
        emergencyContact: true,
        userType: true,
        status: true,
        membershipPlanId: true,
        membershipPlanDurationId: true,
        startDate: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,

        membership: true,
        membershipPlanDuration: true,
        payments: true,
        notifications: true,
      },
    });
    if (members.length === 0) {
      throw new NotFoundException('No Members To Show');
    }

    return members;
  }

  // * Get one Member
  async findOne(adminId: string, memberId: string) {
    // * Check if admin is has already a subscription
    await this.checkIfAdminHasSubscription(adminId);

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
        photo: true,
        address: true,
        emergencyContact: true,
        userType: true,
        status: true,
        membershipPlanId: true,
        membershipPlanDurationId: true,
        startDate: true,
        expiresAt: true,
        notifications: true,
        createdAt: true,
        updatedAt: true,

        membership: true,
        membershipPlanDuration: true,
        payments: true,
      },
    });
    if (!member) {
      throw new NotFoundException('Member Not Found');
    }

    return member;
  }

  // * Delete one Member
  async remove(adminId: string, memberId: string) {
    // * Check if admin is has already a subscription
    await this.checkIfAdminHasSubscription(adminId);

    const member = await this.prisma.member.findFirst({
      where: {
        adminId,
        id: memberId,
      },
    });
    if (!member) {
      throw new NotFoundException('Member Not Found!');
    }

    await this.prisma.member.delete({
      where: {
        adminId,
        id: memberId,
      },
    });
  }

  // ! Private Attributes
  // * Check if admin has subscription
  private async checkIfAdminHasSubscription(adminId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId: adminId, status: SubscriptionStatus.ACTIVE },
      include: { plan: true },
    });
    if (!subscription) {
      throw new UnauthorizedException(
        'You don’t have an active subscription. Upgrade your plan to continue.',
      );
    }

    return subscription;
  }

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
      throw new NotFoundException('There is No Plan, Please Add a Plan');
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

    return duration;
  }
}
