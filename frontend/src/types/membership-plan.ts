export interface MembershipPlanDuration {
  id: string;
  membershipPlanId: string;
  durationDays: number;
  price: number | string;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlan {
  id: string;
  adminId: string;
  planName: string;
  description?: string;
  weeklyVisitLimit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  membershipPlanDurations: MembershipPlanDuration[];
}

export interface AddMembershipPlanInput {
  planName: string;
  description?: string;
  weeklyVisitLimit: number;
}

export interface UpdateMembershipPlanInput {
  planName?: string;
  description?: string;
  weeklyVisitLimit?: number;
  isActive?: boolean;
}

export interface AddMembershipPlanDurationInput {
  membershipPlanId: string;
  durationDays: number;
  price: number;
}

export interface UpdateMembershipPlanDurationInput {
  membershipPlanId: string;
  durationDays?: number;
  price?: number;
}
