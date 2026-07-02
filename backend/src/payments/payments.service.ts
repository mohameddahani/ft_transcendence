import {
  MembershipStatus,
  SubscriptionStatus,
  UserType,
} from '@/generated/prisma/enums';
import { PrismaService } from '@/prisma/prisma.service';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  // * Get all Payments
  async findAll(
    userId: string,
    userType: UserType,
    page: number,
    limit: number,
  ) {
    if (userType === UserType.ADMIN) {
      // * Check if admin has subscription
      await this.checkIfAdminHasSubscription(userId);

      const payments = await this.prisma.payment.findMany({
        where: {
          adminId: userId,
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          adminId: true,
          member: {
            select: {
              id: true,
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
              memberships: true,
              payments: true,
              notifications: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          amount: true,
          paidAt: true,
          dueDate: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!payments) {
        throw new NotFoundException('There Is No Payments To Show');
      }

      return payments;
    } else {
      // * Check if member has membership plan
      const member = await this.checkIfMemberHasMembership(userId);

      return member.payments;
    }
  }

  // * Get one payment
  async findOne(userId: string, userType: UserType, id: string) {
    if (userType === UserType.ADMIN) {
      // * Check if admin has subscription
      await this.checkIfAdminHasSubscription(userId);

      const payment = await this.prisma.payment.findFirst({
        where: {
          adminId: userId,
          id: id,
        },
        select: {
          id: true,
          adminId: true,
          member: {
            select: {
              id: true,
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
              memberships: true,
              payments: true,
              notifications: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          amount: true,
          paidAt: true,
          dueDate: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!payment) {
        throw new NotFoundException('There is No Payment To Show!');
      }

      return payment;
    } else {
      // * Check if member has membership plan
      await this.checkIfMemberHasMembership(userId);

      const payment = await this.prisma.payment.findFirst({
        where: {
          memberId: userId,
          id: id,
        },
      });
      if (!payment) {
        throw new NotFoundException('There is No Payment To Show!');
      }

      return payment;
    }
  }

  // ! Private Attributes
  // * Check if admin has subscription
  private async checkIfAdminHasSubscription(adminId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId: adminId, status: SubscriptionStatus.ACTIVE },
      include: { plan: true },
    });
    if (!subscription || !subscription.plan.isActive) {
      throw new UnauthorizedException(
        'You don’t have an active subscription. Upgrade your plan to continue.',
      );
    }

    return subscription;
  }

  // * Check if member has membership
  private async checkIfMemberHasMembership(memberId: string) {
    // * Check if member already exist
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        payments: true,
      },
    });
    if (!member) {
      throw new NotFoundException('Member Not Found !');
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        memberId: member.id,
        adminId: member.adminId,
        status: MembershipStatus.ACTIVE,
      },
    });
    if (!membership) {
      throw new UnauthorizedException(
        'You don’t have an membership. Upgrade your plan to continue.',
      );
    }

    return member;
  }
}
