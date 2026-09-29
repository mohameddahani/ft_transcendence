import { Prisma } from '@/generated/prisma/client';

/**
 * `satisfies Prisma.UserSelect` checks that this object is a valid Prisma UserSelect
 * while keeping the exact type of the object we wrote.
 *
 * Difference:
 *
 * 1. Normal type annotation:
 *
 *    const select: Prisma.UserSelect = {
 *      id: true,
 *      email: true,
 *    };
 *
 *    Here TypeScript treats `select` as the full `Prisma.UserSelect` type.
 *    Because UserSelect can contain fields like `password`, TypeScript may consider
 *    those fields as possible properties of `select`, even if we did not select them.
 *
 * 2. Using `satisfies`:
 *
 *    const select = {
 *      id: true,
 *      email: true,
 *    } satisfies Prisma.UserSelect;
 *
 *    Here TypeScript only checks:
 *    "Are `id` and `email` valid fields for Prisma.UserSelect?"
 *
 *    But it still remembers the exact object:
 *
 *    {
 *      id: true;
 *      email: true;
 *    }
 *
 *    So TypeScript and Prisma know exactly which fields are selected.
 *
 * In short:
 *
 * `: Prisma.UserSelect`
 *   -> Treat this variable as the general Prisma.UserSelect type.
 *
 * `satisfies Prisma.UserSelect`
 *   -> Check that this object follows Prisma.UserSelect rules,
 *      but keep the exact fields that were actually selected.
 *
 * This is useful for reusable Prisma selects because it gives us:
 * - validation of field names
 * - protection from typos
 * - better TypeScript inference
 * - exact Prisma return types
 */

export const safeUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  gender: true,
  birthDate: true,
  userName: true,
  email: true,
  phoneNumber: true,
  companyName: true,
  role: true,
  profileImageUrl: true,
  isAccountVerified: true,
  accountStatus: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const safeStaffSelect = {
  id: true,
  firstName: true,
  lastName: true,
  gender: true,
  birthDate: true,
  userName: true,
  email: true,
  phoneNumber: true,
  companyName: true,
  adminId: true,
  role: true,
  profileImageUrl: true,
  accountStatus: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.StaffSelect;

export const safeMemberSelect = {
  id: true,
  adminId: true,
  staffId: true,
  firstName: true,
  lastName: true,
  gender: true,
  birthDate: true,
  userName: true,
  email: true,
  phoneNumber: true,
  profileImageUrl: true,
  address: true,
  emergencyContact: true,
  role: true,
  accountStatus: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MemberSelect;
