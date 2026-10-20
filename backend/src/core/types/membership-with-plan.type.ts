import { Prisma } from '@/generated/prisma/client';

export type MembershipWithPlan = Prisma.MembershipGetPayload<{
  include: {
    membershipPlan: true;
  };
}>;
