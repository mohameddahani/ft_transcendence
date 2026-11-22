export type MembershipStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export interface MembershipMember {
  id: string;
  firstName: string;
  lastName: string;
  userName?: string;
  email?: string;
  phoneNumber?: string;
  gender?: string;
  birthDate?: string;
  profileImageUrl?: string;
  accountStatus?: string;
}

export interface MembershipPlan {
  id: string;
  planName: string;
  price?: number | string;
  description?: string | null;
  weeklyVisitLimit?: number;
  isActive?: boolean;
}

export interface MembershipPlanDuration {
  id: string;
  durationDays: number;
  price?: number | string;
  duration?: string;
}

export interface Membership {
  id: string;
  member?: MembershipMember;
  membershipPlan: MembershipPlan;
  membershipPlanDuration?: MembershipPlanDuration | string | null;
  membershipStatus: MembershipStatus | string;
  startDate: string;
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MembershipFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  membershipStatus?: MembershipStatus | string;
  membershipPlanId?: string;
}

