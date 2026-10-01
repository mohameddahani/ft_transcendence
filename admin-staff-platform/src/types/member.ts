export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export type MemberAccountStatus = "ACTIVE" | "FROZEN" | "BANNED";

export interface BackendMembership {
  id: string;
  adminId?: string;
  memberId?: string;
  membershipPlanId?: string;
  membershipPlanDurationId?: string;
  membershipStatus?: "ACTIVE" | "EXPIRED" | "CANCELLED" | string;
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
}

export type UpdateMemberInput = Partial<AddMemberInput>;
