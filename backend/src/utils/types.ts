import { UserType } from '@/generated/prisma/enums';

// * Type of JWT payload
export type JWTPayload = {
  id: number;
  userType: UserType;
};
