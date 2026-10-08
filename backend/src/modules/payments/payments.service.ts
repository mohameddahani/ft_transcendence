import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AccessTokenPayload } from '@/core/types/jwt-payload.type';
import { AccessesService } from '@/core/access/access.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessesService: AccessesService,
  ) {}

  // * Get all Payments
  async findAllPayments(
    accessTokenPayload: AccessTokenPayload,
    page: number,
    limit: number,
  ) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

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
    if (payments.length === 0) {
      throw new NotFoundException('There Is No Payments To Show');
    }

    return payments;
  }

  // * Get one payment
  async findOnePayment(accessTokenPayload: AccessTokenPayload, id: string) {
    // * Check Authorize Admin or Staff Access
    const { adminId } =
      await this.accessesService.authorizeAdminOrStaffAccess(
        accessTokenPayload,
      );

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

  // * Get all Payments (Member)
  async findAllPaymentsMember(memberId: string, page: number, limit: number) {
    // * Get Admin Id from member
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

    // * Check that the admin account, subscription, and plan are active.
    await this.accessesService.validateAdminAccountAndSubscription(adminId);

    // * Check that the member account and membership are active.
    await this.accessesService.validateMemberAccountAndMembership(
      memberId,
      adminId,
    );

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

  // * Get one payment (Member)
  async findOnePaymentMember(memberId: string, id: string) {
    // * Get Admin Id from member
    const adminId =
      await this.accessesService.resolveAdminIdFromMemberId(memberId);

    // * Check that the admin account, subscription, and plan are active.
    await this.accessesService.validateAdminAccountAndSubscription(adminId);

    // * Check that the member account and membership are active.
    await this.accessesService.validateMemberAccountAndMembership(
      memberId,
      adminId,
    );

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
}
