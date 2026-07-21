import { UserType } from '@/generated/prisma/enums';

export type AccessTokenPayload = {
  id: string;
  userType: UserType;
};

export type RefreshTokenPayload = {
  id: string;
  userType: UserType;
  jti: string;
};
