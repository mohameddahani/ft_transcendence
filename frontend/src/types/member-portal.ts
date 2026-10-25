export interface MemberProfile {
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | string;
  birthDate: string;
  userName: string;
  email: string;
  phoneNumber: string;
  profileImageUrl?: string;
  address?: string | null;
  emergencyContact?: string | null;
  role: string;
  accountStatus: string;
  companyName?: string;
  admin?: {
    companyName?: string;
  };
}

export interface MemberMembershipPlan {
  id: string;
  planName: string;
  price: string | number;
  description?: string | null;
  weeklyVisitLimit: number;
}

export interface MemberMembershipDuration {
  id: string;
  durationDays: number;
  price: number | string;
  membershipPlanId?: string;
  createdAt?: string;
  updatedAt?: string;
  duration?: string;
}

export interface MemberMembership {
  id?: string;
  membershipPlan: MemberMembershipPlan;
  membershipPlanDuration?: MemberMembershipDuration | string | null;
  membershipStatus: "ACTIVE" | "EXPIRED" | "FROZEN" | "CANCELLED" | string;
  startDate: string;
  expiresAt: string;
}

export function formatMembershipDuration(
  duration?: MemberMembershipDuration | string | null
): string {
  if (!duration) return "Standard Duration";
  if (typeof duration === "string") return duration;
  if (typeof duration === "object") {
    if (typeof duration.durationDays === "number") {
      if (duration.durationDays === 30) return "1 Month (30 Days)";
      if (duration.durationDays === 90) return "3 Months (90 Days)";
      if (duration.durationDays === 180) return "6 Months (180 Days)";
      if (duration.durationDays === 365) return "1 Year (365 Days)";
      return `${duration.durationDays} Days`;
    }
    if (duration.duration) return duration.duration;
  }
  return "Standard Duration";
}

export type VisitStatusType = "READY" | "CHECKED_IN" | "CANCELLED" | "EXPIRED" | string;

export interface MemberVisit {
  id: string;
  visitDateAndTime: string;
  visitStatus: VisitStatusType;
  createdAt: string;
  membership?: {
    membershipPlan?: {
      planName?: string;
    };
  } | null;
}

export interface MemberAttendance {
  id: string;
  attendanceMethod: "QR_CODE" | "MANUAL" | string;
  checkedInAt: string;
  createdAt: string;
  visit?: {
    id: string;
    visitDateAndTime: string;
  } | null;
}
