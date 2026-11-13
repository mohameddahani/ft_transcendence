import api from "@/lib/axios";
import { getApiEndpoint } from "@/lib/api/config";
import { getCachedOrFetch, invalidateCache } from "@/lib/api/cache";

export type MoneyValue = number | string | null;

export interface AttendanceStats {
  qrCodeCount: number;
  manualCount: number;
  total: number;
}

export interface VisitStats {
  readyCount: number;
  checkedInCount: number;
  cancelledCount: number;
  expiredCount: number;
  total: number;
}

export interface FeedbackStats {
  openCount: number;
  inReviewCount: number;
  resolvedCount: number;
  dismissedCount: number;
  negativeCount: number;
  neutralCount: number;
  positiveCount: number;
  total: number;
  averageRating: number | null;
  myCount?: number;
}

export interface AccountStats {
  activeCount: number;
  pendingCount: number;
  bannedCount: number;
  total: number;
}

export interface MemberStats extends AccountStats {
  expiredCount: number;
}

export interface PlanStats {
  activeCount: number;
  inactiveCount: number;
  total: number;
  durationCount: number;
}

export interface MembershipStats {
  activeCount: number;
  expiredCount: number;
  cancelledCount: number;
  total: number;
}

export interface NotificationStats {
  paymentReminderCount: number;
  membershipExpirationCount: number;
  subscriptionExpirationCount: number;
  customCount: number;
  isReadCount: number;
  isNotReadCount: number;
  total: number;
}

export interface PaymentStats {
  totalAmount: MoneyValue;
  totalPayments: number;
}

export interface StaffPaymentStats {
  totalPayments: number;
}

export interface OwnerUserStats extends AccountStats {
  verifiedCount: number;
  unverifiedCount: number;
  adminCount: number;
  ownerCount: number;
}

export interface SubscriptionStats extends MembershipStats {
  totalAmount: MoneyValue;
}

export interface WorkingHoursStats {
  workingHours: {
    total: number;
    openDaysCount: number;
    closedDaysCount: number;
  };
  specialHours: {
    total: number;
  };
}

// 15 seconds TTL for statistics
const STATS_TTL_MS = 15_000;

export function invalidateStatsCache(prefix = "stats:") {
  invalidateCache(prefix);
}

// ==========================================
// Admin Statistics
// ==========================================

export async function fetchAdminMemberStats(forceRefresh = false): Promise<MemberStats> {
  return getCachedOrFetch(
    "stats:admin:members",
    async () => {
      const res = await api.get<MemberStats>(getApiEndpoint("/api/admins/members/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchAdminVisitStats(forceRefresh = false): Promise<VisitStats> {
  return getCachedOrFetch(
    "stats:admin:visits",
    async () => {
      const res = await api.get<VisitStats>(getApiEndpoint("/api/admins/visits/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchAdminFeedbackStats(forceRefresh = false): Promise<FeedbackStats> {
  return getCachedOrFetch(
    "stats:admin:feedbacks",
    async () => {
      const res = await api.get<FeedbackStats>(getApiEndpoint("/api/admins/feedbacks/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchAdminPaymentStats(forceRefresh = false): Promise<PaymentStats> {
  return getCachedOrFetch(
    "stats:admin:payments",
    async () => {
      const res = await api.get<PaymentStats>(getApiEndpoint("/api/admins/payments/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchAdminPlanStats(forceRefresh = false): Promise<PlanStats> {
  return getCachedOrFetch(
    "stats:admin:plans",
    async () => {
      const res = await api.get<PlanStats>(getApiEndpoint("/api/admins/membership-plans/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchAdminMembershipStats(forceRefresh = false): Promise<MembershipStats> {
  return getCachedOrFetch(
    "stats:admin:memberships",
    async () => {
      const res = await api.get<MembershipStats>(getApiEndpoint("/api/admins/memberships/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchAdminNotificationStats(forceRefresh = false): Promise<NotificationStats> {
  return getCachedOrFetch(
    "stats:admin:notifications",
    async () => {
      const res = await api.get<NotificationStats>(getApiEndpoint("/api/admins/notifications/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchAdminStaffStats(forceRefresh = false): Promise<AccountStats> {
  return getCachedOrFetch(
    "stats:admin:staffs",
    async () => {
      const res = await api.get<AccountStats>(getApiEndpoint("/api/admins/staffs/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchAdminSubscriptionStats(forceRefresh = false): Promise<SubscriptionStats> {
  return getCachedOrFetch(
    "stats:admin:subscriptions",
    async () => {
      const res = await api.get<SubscriptionStats>(getApiEndpoint("/api/admins/subscriptions/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchAdminWorkingHoursStats(forceRefresh = false): Promise<WorkingHoursStats> {
  return getCachedOrFetch(
    "stats:admin:working-hours",
    async () => {
      const res = await api.get<WorkingHoursStats>(getApiEndpoint("/api/admins/working-hours/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

// ==========================================
// Staff Statistics
// ==========================================

export async function fetchStaffMemberStats(forceRefresh = false): Promise<MemberStats> {
  return getCachedOrFetch(
    "stats:staff:members",
    async () => {
      const res = await api.get<MemberStats>(getApiEndpoint("/api/staffs/members/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchStaffVisitStats(forceRefresh = false): Promise<VisitStats> {
  return getCachedOrFetch(
    "stats:staff:visits",
    async () => {
      const res = await api.get<VisitStats>(getApiEndpoint("/api/staffs/visits/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchStaffFeedbackStats(forceRefresh = false): Promise<FeedbackStats> {
  return getCachedOrFetch(
    "stats:staff:feedbacks",
    async () => {
      const res = await api.get<FeedbackStats>(getApiEndpoint("/api/staffs/feedbacks/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchStaffPaymentStats(forceRefresh = false): Promise<StaffPaymentStats> {
  return getCachedOrFetch(
    "stats:staff:payments",
    async () => {
      const res = await api.get<StaffPaymentStats>(getApiEndpoint("/api/staffs/payments/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchStaffPlanStats(forceRefresh = false): Promise<PlanStats> {
  return getCachedOrFetch(
    "stats:staff:plans",
    async () => {
      const res = await api.get<PlanStats>(getApiEndpoint("/api/staffs/membership-plans/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchStaffMembershipStats(forceRefresh = false): Promise<MembershipStats> {
  return getCachedOrFetch(
    "stats:staff:memberships",
    async () => {
      const res = await api.get<MembershipStats>(getApiEndpoint("/api/staffs/memberships/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchStaffWorkingHoursStats(forceRefresh = false): Promise<WorkingHoursStats> {
  return getCachedOrFetch(
    "stats:staff:working-hours",
    async () => {
      const res = await api.get<WorkingHoursStats>(getApiEndpoint("/api/staffs/working-hours/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

// ==========================================
// Member Statistics
// ==========================================

export async function fetchMemberAttendanceStats(forceRefresh = false): Promise<AttendanceStats> {
  return getCachedOrFetch(
    "stats:member:attendances",
    async () => {
      const res = await api.get<AttendanceStats>(getApiEndpoint("/api/members/attendances/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchMemberVisitStats(forceRefresh = false): Promise<VisitStats> {
  return getCachedOrFetch(
    "stats:member:visits",
    async () => {
      const res = await api.get<VisitStats>(getApiEndpoint("/api/members/visits/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchMemberFeedbackStats(forceRefresh = false): Promise<FeedbackStats> {
  return getCachedOrFetch(
    "stats:member:feedbacks",
    async () => {
      const res = await api.get<FeedbackStats>(getApiEndpoint("/api/members/feedbacks/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchMemberMembershipStats(forceRefresh = false): Promise<MembershipStats> {
  return getCachedOrFetch(
    "stats:member:memberships",
    async () => {
      const res = await api.get<MembershipStats>(getApiEndpoint("/api/members/memberships/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchMemberNotificationStats(forceRefresh = false): Promise<NotificationStats> {
  return getCachedOrFetch(
    "stats:member:notifications",
    async () => {
      const res = await api.get<NotificationStats>(getApiEndpoint("/api/members/notifications/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchMemberPaymentStats(forceRefresh = false): Promise<PaymentStats> {
  return getCachedOrFetch(
    "stats:member:payments",
    async () => {
      const res = await api.get<PaymentStats>(getApiEndpoint("/api/members/payments/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchMemberWorkingHoursStats(forceRefresh = false): Promise<WorkingHoursStats> {
  return getCachedOrFetch(
    "stats:member:working-hours",
    async () => {
      const res = await api.get<WorkingHoursStats>(getApiEndpoint("/api/members/working-hours/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

// ==========================================
// Owner & Public Statistics
// ==========================================

export async function fetchOwnerUserStats(forceRefresh = false): Promise<OwnerUserStats> {
  return getCachedOrFetch(
    "stats:owner:users",
    async () => {
      // Backend controller is @Controller('owners') + @Get('users/stats') -> /api/owners/users/stats
      const res = await api.get<OwnerUserStats>(getApiEndpoint("/api/owners/users/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchOwnerSubscriptionStats(forceRefresh = false): Promise<SubscriptionStats> {
  return getCachedOrFetch(
    "stats:owner:subscriptions",
    async () => {
      const res = await api.get<SubscriptionStats>(getApiEndpoint("/api/owners/subscriptions/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

export async function fetchPublicPlanStats(forceRefresh = false): Promise<PlanStats> {
  return getCachedOrFetch(
    "stats:public:plans",
    async () => {
      const res = await api.get<PlanStats>(getApiEndpoint("/api/plans/stats"));
      return res.data;
    },
    STATS_TTL_MS,
    forceRefresh
  );
}

