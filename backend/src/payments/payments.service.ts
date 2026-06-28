import { SubscriptionStatus, UserType } from '@/generated/prisma/enums';
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
              userName: true,
              email: true,
              phoneNumber: true,
              photo: true,
              startDate: true,
              expiresAt: true,

              membership: true,
              membershipPlanDuration: true,
            },
          },
          amount: true,
          paidAt: true,
          dueDate: true,
          status: true,
          note: true,
        },
      });
      if (!payments) {
        throw new NotFoundException('There Is No Payments To Show');
      }

      return payments;
    } else {
      // * Check if member has membership plan
      const member = await this.checkIfMemberHasMembershipPlan(userId);

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
              userName: true,
              email: true,
              phoneNumber: true,
              photo: true,
              startDate: true,
              expiresAt: true,

              membership: true,
              membershipPlanDuration: true,
            },
          },
          amount: true,
          paidAt: true,
          dueDate: true,
          status: true,
          note: true,
        },
      });
      if (!payment) {
        throw new NotFoundException('There is No Payment To Show!');
      }

      return payment;
    } else {
      // * Check if member has membership plan
      await this.checkIfMemberHasMembershipPlan(userId);

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

  // * Delete one payment
  async remove(adminId: string, id: string) {
    // * Check if admin has subscription
    await this.checkIfAdminHasSubscription(adminId);

    const payment = await this.prisma.payment.findFirst({
      where: {
        id: id,
        adminId: adminId,
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment Not Found!');
    }

    await this.prisma.payment.delete({
      where: {
        id: id,
        adminId: adminId,
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

  // * Check if member has membership plan
  private async checkIfMemberHasMembershipPlan(memberId: string) {
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

    const membershipPlan = await this.prisma.membershipPlan.findUnique({
      where: { id: member.membershipPlanId },
    });
    if (!membershipPlan) {
      throw new UnauthorizedException(
        'You don’t have an membership Plan. Upgrade your plan to continue.',
      );
    }

    return member;
  }
}
