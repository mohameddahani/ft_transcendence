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
