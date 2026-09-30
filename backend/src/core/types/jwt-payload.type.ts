import { Prisma } from '@/generated/prisma/client';
import { Role } from '@/generated/prisma/enums';

export type AccessTokenPayload = {
  id: string;
  role: Role;
};

export type RefreshTokenPayload = {
  id: string;
  role: Role;
  jti: string;
};

export type MembershipWithPlan = Prisma.MembershipGetPayload<{
  include: {
    membershipPlan: true;
  };
}>;
