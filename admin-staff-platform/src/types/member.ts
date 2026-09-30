export interface BackendMembership {
  id: string;
  adminId?: string;
  memberId?: string;
  membershipPlanId?: string;
  membershipPlanDurationId?: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | string;
  startDate?: string;
  expiresAt?: string;
  createdAt?: string;
  membershipPlan?: {
    id: string;
    name?: string;
    planName?: string;
  };
  membershipPlanDuration?: {
    id: string;
    duration?: string;
    price?: number;
  };
}

export interface BackendMember {
  id: string;
  firstName: string;
  lastName: string;
  userName?: string;
  email: string;
  phoneNumber?: string;
  gender?: string;
  birthDate?: string;
  photo?: string | null;
  address?: string;
  emergencyContact?: string;
  userType?: string;
  status?: "ACTIVE" | "FROZEN" | "BANNED" | string;
  memberships?: BackendMembership[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}
