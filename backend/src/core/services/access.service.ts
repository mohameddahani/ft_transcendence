import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  MemberAccountStatus,
  MembershipStatus,
  Role,
  SubscriptionStatus,
  UserAccountStatus,
} from '@/generated/prisma/enums';
import { AccessTokenPayload } from '../types/jwt-payload.type';
import { safeMemberSelect, safeUserSelect } from '../types/safe-selects.type';

@Injectable()
export class AccessesService {
  constructor(private readonly prisma: PrismaService) {}

  // * Authorize an admin or staff caller and validate the admin's access.
  async authorizeAdminOrStaffAccess(
    payload: AccessTokenPayload,
    checkDate: Date = new Date(),
  ) {
    // * Get admin id and check staff account status if payload belong to staff
    const adminId = await this.resolveAdminId(payload);

    // * Check Subscription of admin and check his account status
    const subscription = await this.validateAdminAccountAndSubscription(
      adminId,
      checkDate,
    );

    return {
      adminId,
      subscription,
    };
  }

  // * Check that the admin account, subscription, and plan are active.
  async validateAdminAccountAndSubscription(
    adminId: string,
    checkDate: Date = new Date(),
  ) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId: adminId,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        expiresAt: { gt: checkDate },
      },
      include: {
        plan: true,
        user: { select: safeUserSelect },
      },
    });

    if (!subscription) {
      throw new ForbiddenException(
        'An active admin subscription is required to continue.',
      );
    }

    // * Check account status
    this.assertUserAccountActive(
      subscription.user.accountStatus,
      'The admin account',
    );

    if (!subscription.plan.isActive) {
      throw new ForbiddenException('The subscription plan is inactive.');
    }

    return subscription;
  }

  // * Check that the member has an active account and membership
  // * belonging to the specified admin.
  async validateMemberAccountAndMembership(
    memberId: string,
    adminId: string,
    checkDate: Date = new Date(),
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: {
        adminId,
        memberId,
        membershipStatus: MembershipStatus.ACTIVE,
        expiresAt: { gt: checkDate },
      },
      include: {
        membershipPlan: true,
        member: { select: safeMemberSelect },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'An active membership under this admin is required to continue.',
      );
    }

    // * Check account status
    this.assertMemberAccountActive(membership.member.accountStatus);

    return membership;
  }

  // * Look up a member's admin ID.
  // * This lookup alone does not authorize access to the member.
  async resolveAdminIdFromMemberId(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        adminId: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found.');
    }

    return member.adminId;
  }

  // ! Private
  // * Resolve the caller's admin ID and check staff status when applicable.
  // * Admin account validation is completed by authorizeAdminOrStaffAccess().
  private async resolveAdminId(payload: AccessTokenPayload) {
    if (payload.role === Role.ADMIN) {
      return payload.id;
    } else if (payload.role === Role.STAFF) {
      const staff = await this.prisma.staff.findUnique({
        where: { id: payload.id },
        select: {
          adminId: true,
          accountStatus: true,
        },
      });

      if (!staff) {
        throw new UnauthorizedException(
          'The account associated with this session no longer exists.',
        );
      }

      // * Check account status
      this.assertUserAccountActive(staff.accountStatus, 'Your staff account');

      return staff.adminId;
    } else {
      throw new ForbiddenException(
        'This action is only available to admins and staff.',
      );
    }
  }

  // * Validate an already-loaded admin or staff status without querying the DB.
  private assertUserAccountActive(
    status: UserAccountStatus,
    accountLabel: string,
  ): void {
    if (status === UserAccountStatus.ACTIVE) {
      return;
    } else if (status === UserAccountStatus.INACTIVE) {
      throw new ForbiddenException(
        `${accountLabel} is inactive. Please contact support for assistance.`,
      );
    } else if (status === UserAccountStatus.PENDING) {
      throw new ForbiddenException(`${accountLabel} is pending approval.`);
    } else if (status === UserAccountStatus.BANNED) {
      throw new ForbiddenException(
        `${accountLabel} has been suspended. Please contact support for assistance.`,
      );
    } else {
      throw new ForbiddenException(`${accountLabel} is not active.`);
    }
  }

  // * Validate an already-loaded member status without querying the DB.
  private assertMemberAccountActive(status: MemberAccountStatus) {
    if (status === MemberAccountStatus.ACTIVE) {
      return;
    } else if (status === MemberAccountStatus.FROZEN) {
      throw new ForbiddenException('The member account is frozen.');
    } else if (status === MemberAccountStatus.BANNED) {
      throw new ForbiddenException('The member account has been suspended.');
    } else {
      throw new ForbiddenException('The member account is not active.');
    }
  }
}
