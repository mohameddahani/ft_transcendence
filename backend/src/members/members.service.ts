import { PrismaService } from '@/prisma/prisma.service';
import { AddMemeberDto } from '@/members/dtos/add-member.dto';
import { generateUsername } from '@/utils/generate-username';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  // * Add Member by Admin
  async addMember(adminId: string, data: AddMemeberDto) {
    // * Check if admin is has already a subscription
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId: adminId,
      },
    });
    if (!subscription) {
      throw new UnauthorizedException(
        'You don’t have an active subscription. Upgrade your plan to continue.',
      );
    }

    // * Check if the admin has this plan
    const plans = await this.prisma.membershipPlan.findUnique({
      where: {
        id: data.membershipId,
      },
    });
    if (!plans) {
      throw new NotFoundException('There is No Plan, Please Add a Plan');
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
    await this.prisma.member.create({
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
          connect: { id: data.membershipId },
        },
        membershipPlanDuration: { connect: { id: '' } }, // ! ADD ID HERE
        // endDate: data.endDate,
      },
    });
  }
}
