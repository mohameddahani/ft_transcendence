import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AccessTokenPayload } from '../types/jwt-payload.type';
import {
  MemberAccountStatus,
  MembershipStatus,
  Role,
  SubscriptionStatus,
  UserAccountStatus,
} from '@/generated/prisma/enums';
import { safeMemberSelect, safeUserSelect } from '../types/safe-selects.type';

@Injectable()
export class AccessesService {
  constructor(private readonly prisma: PrismaService) {}

  // ! Global Methods
  // * Check that the admin account, subscription, and associated plan are active.
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
      include: { plan: true, user: { select: safeUserSelect } },
    });
    if (!subscription || !subscription.plan.isActive) {
      throw new UnauthorizedException(
        'You don’t have an active subscription. Upgrade your plan to continue.',
      );
    } else if (subscription.user.accountStatus !== UserAccountStatus.ACTIVE) {
      if (subscription.user.accountStatus === UserAccountStatus.INACTIVE) {
        throw new UnauthorizedException(
          'Your account is inactive. Please activate your account to continue.',
        );
      } else if (
        subscription.user.accountStatus === UserAccountStatus.PENDING
      ) {
        throw new UnauthorizedException(
          'Your account is currently pending approval. Please wait until your account has been reviewed, or Please contact support for assistance.',
        );
      } else if (subscription.user.accountStatus === UserAccountStatus.BANNED) {
        throw new UnauthorizedException(
          'Your account has been suspended. Please contact support for assistance.',
        );
      }
    }

    return subscription;
  }

  // * Check that the member account and membership are active.
  async validateMemberAccountAndMembership(
    memberId: string,
    adminId: string,
    checkDate: Date = new Date(),
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: {
        adminId: adminId,
        memberId: memberId,
        membershipStatus: MembershipStatus.ACTIVE,
        expiresAt: { gt: checkDate },
      },
      include: {
        membershipPlan: true,
        member: { select: safeMemberSelect },
      },
    });

    if (!membership) {
      throw new NotFoundException(
        'This member does not have an active membership.',
      );
    } else if (membership.member.accountStatus !== MemberAccountStatus.ACTIVE) {
      if (membership.member.accountStatus === MemberAccountStatus.FROZEN) {
        throw new UnauthorizedException(
          'Your account is frozen. Please contact support for assistance.',
        );
      } else if (
        membership.member.accountStatus === MemberAccountStatus.BANNED
      ) {
        throw new UnauthorizedException(
          'Your account has been suspended. Please contact support for assistance.',
        );
      } else {
        throw new UnauthorizedException('Your account is not active.');
      }
    }

    return membership;
  }

  // * Resolve Admin Id
  async resolveAdminId(accessTokenPayload: AccessTokenPayload) {
    if (accessTokenPayload.role === Role.ADMIN) {
      return accessTokenPayload.id;
    }

    if (accessTokenPayload.role === Role.STAFF) {
      const staff = await this.prisma.staff.findUnique({
        where: { id: accessTokenPayload.id },
        select: {
          adminId: true,
        },
      });

      if (!staff) {
        throw new NotFoundException('Staff not found');
      }

      return staff.adminId;
    }

    throw new UnauthorizedException();
  }

  // * Get Admin Id from Access Token Payload Of Member
  async resolveAdminIdFromMemberId(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        adminId: true,
      },
    });
    if (!member) {
      throw new NotFoundException('Member Not Found');
    }

    return member.adminId;
  }
}
