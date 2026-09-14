import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AccessTokenPayload } from '../types/jwt-payload.type';
import {
  Role,
  SubscriptionStatus,
  UserAccountStatus,
} from '@/generated/prisma/enums';

@Injectable()
export class AccessesService {
  constructor(private readonly prisma: PrismaService) {}

  // ! Global Methods
  // * Check if admin has subscription
  async checkIfAdminHasSubscription(adminId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId: adminId, subscriptionStatus: SubscriptionStatus.ACTIVE },
      include: { plan: true, user: true },
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

  // * Get Admin Id from Access Token Payload Of Staff
  async getAdminIdFromAccessTokenPayloadOfStaff(
    accessTokenPayload: AccessTokenPayload,
  ) {
    // * Get Admin id
    let adminId: string;

    if (accessTokenPayload.role === Role.STAFF) {
      const staff = await this.prisma.staff.findUnique({
        where: { id: accessTokenPayload.id },
      });
      if (!staff) {
        throw new NotFoundException('Staff Not Found');
      }

      adminId = staff.adminId;
    } else if (accessTokenPayload.role === Role.ADMIN) {
      adminId = accessTokenPayload.id;
    } else {
      throw new UnauthorizedException();
    }

    return adminId;
  }
}
