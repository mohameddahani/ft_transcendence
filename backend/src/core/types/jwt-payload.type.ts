import { UserType } from '@/generated/prisma/enums';

// * Type of JWT payload
export type JwtPayload = {
  id: string;
  userType: UserType;
};
