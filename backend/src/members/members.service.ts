import { PrismaService } from '@/prisma/prisma.service';
import { AddMemeberDto } from '@/members/dtos/add-member.dto';
import { generateUsername } from '@/utils/generate-username';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentStatus, SubscriptionStatus } from '@/generated/prisma/enums';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  // * Add Member by Admin
  async addMember(adminId: string, data: AddMemeberDto) {
    // * Check if admin is has already a subscription
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId: adminId,
        status: SubscriptionStatus.ACTIVE,
        expiresAt: {
          gt: new Date(), // * check if subscription is expired
        },
      },
      include: {
        plan: true,
      },
    });
    if (!subscription) {
      throw new UnauthorizedException(
        'You don’t have an active subscription. Upgrade your plan to continue.',
      );
    }

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

    // * Check if the admin has this membership plan
    const membershipPlan = await this.prisma.membershipPlan.findUnique({
      where: {
        id: data.membershipPlanId,
      },
    });
    if (!membershipPlan) {
      throw new NotFoundException('There is No Plan, Please Add a Plan');
    }

    // * Check if duration is already exist for this membership plan
    const duration = await this.prisma.membershipPlanDuration.findFirst({
      where: {
        id: data.durationId,
        membershipPlanId: data.membershipPlanId,
      },
    });
    if (!duration) {
      throw new NotFoundException('Duration does not exist for this plan');
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
        amount: member.membershipPlanDuration.price,
        paidAt: member.startDate,
        dueDate: member.expiresAt,
        status: PaymentStatus.PAID,
        note: data.note,
      },
    });
  }

  // * Get all Members
  async findAll(adminId: string, page: number, limit: number) {
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
        createdAt: true,
        updatedAt: true,

        membership: true,
        membershipPlanDuration: true,
        payments: true,
        notifications: true,
      },
    });
    if (!member) {
      throw new NotFoundException('No Member To Show');
    }

    return member;
  }
}
