export type VisitStatus = "READY" | "CHECKED_IN" | "CANCELLED";

export type AttendanceMethod = "MANUAL" | "QR_CODE";

export interface VisitMember {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  photo?: string | null;
  profileImage?: string | null;
  gender?: string;
  memberships?: unknown[];
}

export interface VisitMembership {
  id: string;
  status?: string;
  membershipStatus?: string;
  startDate?: string;
  endDate?: string;
  expiresAt?: string;
  membershipPlanId?: string;
  membershipPlanDurationId?: string;
  membershipPlan?: {
    id?: string;
    planName?: string;
    name?: string;
    weeklyVisitLimit?: number;
    price?: number;
    maxMembers?: number;
  };
  membershipPlanDuration?: {
    id?: string;
    durationDays?: number;
    duration?: string;
    price?: number | string;
  };
  plan?: {
    id?: string;
    planName?: string;
    weeklyVisitLimit?: number;
    price?: number;
    maxMembers?: number;
  };
}

export interface TodayVisit {
  id: string;
  adminId?: string;
  memberId?: string;
  membershipId?: string;
  visitDateAndTime: string;
  visitStatus: VisitStatus;
  createdAt: string;
  member: VisitMember;
  membership?: VisitMembership;
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
    userName?: string;
    companyName?: string;
  };
}

export interface CheckInResponse {
  message?: string;
  attendanceId?: string;
  checkedInAt?: string;
  visit?: TodayVisit;
}
