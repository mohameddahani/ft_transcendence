export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export enum AccountStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  BANNED = "BANNED",
}

export enum MembershipStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export type MemberAccountStatus = "ACTIVE" | "PENDING" | "BANNED";

export interface BackendMembership {
  id: string;
  adminId?: string;
  memberId?: string;
  membershipPlanId?: string;
  membershipPlanDurationId?: string;
  membershipStatus?: MembershipStatus | "ACTIVE" | "EXPIRED" | "CANCELLED" | string;
  startDate?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
  membershipPlan?: {
    id: string;
    planName?: string;
    name?: string;
    description?: string;
    weeklyVisitLimit?: number;
  };
  membershipPlanDuration?: {
    id: string;
    durationDays?: number;
    duration?: string;
    price?: number | string;
  };
}

export interface BackendMemberPayment {
  id: string;
  memberId?: string;
  adminId?: string;
  staffId?: string | null;
  amount: string | number;
  paidAt?: string;
  dueDate?: string;
  paymentStatus?: "PAID" | "PENDING" | "OVERDUE" | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendMember {
  id: string;
  adminId?: string;
  firstName: string;
  lastName: string;
  userName?: string;
  gender: Gender | string;
  birthDate: string;
  email: string;
  phoneNumber: string;
  profileImageUrl?: string | null;
  photo?: string | null;
  address: string;
  emergencyContact: string;
  walletAddress?: string | null;
  role?: string;
  accountStatus: MemberAccountStatus | string;
  status?: string; // backwards compatibility
  memberships?: BackendMembership[];
  payments?: BackendMemberPayment[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface AddMemberInput {
  firstName: string;
  lastName: string;
  gender: Gender | string;
  birthDate: string;
  email: string;
  phoneNumber: string;
  address: string;
  emergencyContact: string;
  membershipPlanId: string;
  membershipPlanDurationId: string;
  walletAddress?: string;
}

export type UpdateMemberInput = Partial<AddMemberInput>;
