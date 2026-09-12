import { MembershipStatus } from '@/generated/prisma/enums';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SubscriptionsService } from '../platform/subscriptions/subscriptions.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // * Get all Payments
  async findAllPaymentsAdmin(adminId: string, page: number, limit: number) {
    // * Check if admin has subscription
    await this.subscriptionsService.checkIfAdminHasSubscription(adminId);

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
        },
        amount: true,
        paidAt: true,
        dueDate: true,
        paymentStatus: true,
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
  async findOnePaymentAdmin(adminId: string, id: string) {
    // * Check if admin has subscription
    await this.subscriptionsService.checkIfAdminHasSubscription(adminId);

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
        },
        amount: true,
        paidAt: true,
        dueDate: true,
        paymentStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment Not Found!');
    }

    return payment;
  }

  // * Get all Payments
  async findAllPaymentsMember(memberId: string, page: number, limit: number) {
    // * Check if member has membership
    await this.checkIfMemberHasMembership(memberId);

    const payments = await this.prisma.payment.findMany({
      where: {
        memberId: memberId,
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
        },
        amount: true,
        paidAt: true,
        dueDate: true,
        paymentStatus: true,
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
  async findOnePaymentMember(memberId: string, id: string) {
    // * Check if member has membership
    await this.checkIfMemberHasMembership(memberId);

    const payment = await this.prisma.payment.findFirst({
      where: {
        id: id,
        memberId: memberId,
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
        },
        amount: true,
        paidAt: true,
        dueDate: true,
        paymentStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment Not Found');
    }

    return payment;
  }

  // ! Private

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
        membershipStatus: MembershipStatus.ACTIVE,
      },
    });
    if (!membership) {
      throw new UnauthorizedException(
        'You don’t have an membership. Upgrade your plan to continue.',
      );
    }

    return { member, membership };
  }
}
