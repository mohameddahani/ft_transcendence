import { AccountStatus, SubscriptionStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AdminPaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  // * Get all Payments
  async findAll(adminId: string, page: number, limit: number) {
    // * Check if admin has subscription
    await this.checkIfAdminHasSubscription(adminId);

    const payments = await this.prisma.payment.findMany({
      where: {
        adminId: adminId,
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
            role: true,
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
  }

  // * Get one payment
  async findOne(adminId: string, id: string) {
    // * Check if admin has subscription
    await this.checkIfAdminHasSubscription(adminId);

    const payment = await this.prisma.payment.findFirst({
      where: {
        adminId: adminId,
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
            role: true,
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
      throw new NotFoundException('Payment Not Found!');
    }

    return payment;
  }

  // ! Private Attributes
  // * Check if admin has subscription
  private async checkIfAdminHasSubscription(adminId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId: adminId, status: SubscriptionStatus.ACTIVE },
      include: { plan: true, user: true },
    });
    if (!subscription || !subscription.plan.isActive) {
      throw new UnauthorizedException(
        'You don’t have an active subscription. Upgrade your plan to continue.',
      );
    } else if (subscription.user.accountStatus !== AccountStatus.ACTIVE) {
      if (subscription.user.accountStatus === AccountStatus.INACTIVE) {
        throw new UnauthorizedException(
          'Your account is inactive. Please activate your account to continue.',
        );
      } else if (subscription.user.accountStatus === AccountStatus.PENDING) {
        throw new UnauthorizedException(
          'Your account is currently pending approval. Please wait until your account has been reviewed, or Please contact support for assistance.',
        );
      } else if (subscription.user.accountStatus === AccountStatus.BANNED) {
        throw new UnauthorizedException(
          'Your account has been suspended. Please contact support for assistance.',
        );
      }
    }

    return subscription;
  }
}
