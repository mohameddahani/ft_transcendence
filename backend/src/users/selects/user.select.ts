import { Prisma } from '@/generated/prisma/client';

// * Ensure this object is a valid Prisma User select object, while preserving exact field information.
// * satisfies = validation WITHOUT losing precision.
export const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  userName: true,
} satisfies Prisma.UserSelect;
