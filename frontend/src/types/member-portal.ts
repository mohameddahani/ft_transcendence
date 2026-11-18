// the duration labels follow the app language through the shared i18n instance (no hook here)
import i18n from "@/lib/i18n";

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
  membershipStatus: "ACTIVE" | "EXPIRED" | "CANCELLED" | string;
  startDate: string;
  expiresAt: string;
}

export function formatMembershipDuration(
  duration?: MemberMembershipDuration | string | null
): string {
  if (!duration) return i18n.t("standardDuration", "Standard Duration");
  if (typeof duration === "string") return duration;
  if (typeof duration === "object") {
    if (typeof duration.durationDays === "number") {
      if (duration.durationDays === 30) return i18n.t("duration30", "1 Month (30 Days)");
      if (duration.durationDays === 90) return i18n.t("duration90", "3 Months (90 Days)");
      if (duration.durationDays === 180) return i18n.t("duration180", "6 Months (180 Days)");
      if (duration.durationDays === 365) return i18n.t("duration365", "1 Year (365 Days)");
      return i18n.t("daysCount", { count: duration.durationDays });
    }
    if (duration.duration) return duration.duration;
  }
  return i18n.t("standardDuration", "Standard Duration");
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
