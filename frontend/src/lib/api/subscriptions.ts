import api from "@/lib/axios";
import { SportiumSubscription, GymflowSubscription, PlatformPlanWithDurations } from "@/types/subscription";

export interface FetchSubscriptionsParams {
  page?: number;
  limit?: number;
  search?: string;
  subscriptionStatus?: "ACTIVE" | "EXPIRED" | "CANCELLED" | string;
  planId?: string;
}

/**
 * Fetch the admin's current active Sportium platform subscription
 */
export async function fetchMySubscription(): Promise<SportiumSubscription | null> {
  const response = await api.get<SportiumSubscription | null>(
    "/api/admins/subscriptions/me"
  );
  return response.data;
}

/**
 * Fetch all Sportium subscriptions (history ledger) of the admin
 */
export async function fetchAllSubscriptions(
  pageOrParams: number | FetchSubscriptionsParams = 1,
  limit = 50,
  subscriptionStatus?: string,
  planId?: string
): Promise<SportiumSubscription[]> {
  let page = 1;
  let pageLimit = 50;
  let queryStatus: string | undefined;
  let queryPlanId: string | undefined;

  if (typeof pageOrParams === "object") {
    page = pageOrParams.page ?? 1;
    pageLimit = pageOrParams.limit ?? 50;
    queryStatus = pageOrParams.subscriptionStatus;
    queryPlanId = pageOrParams.planId;
  } else {
    page = pageOrParams;
    pageLimit = limit;
    queryStatus = subscriptionStatus;
    queryPlanId = planId;
  }

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(pageLimit));

  if (queryStatus && queryStatus !== "ALL") {
    query.set("subscriptionStatus", queryStatus);
  }
  if (queryPlanId && queryPlanId !== "ALL") {
    query.set("planId", queryPlanId);
  }

  const response = await api.get<SportiumSubscription[]>(
    `/api/admins/subscriptions/all?${query.toString()}`
  );
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Fetch Owner platform subscriptions
 */
export async function fetchOwnerSubscriptions(
  pageOrParams: number | FetchSubscriptionsParams = 1,
  limit = 20,
  search?: string,
  subscriptionStatus?: string,
  planId?: string
): Promise<SportiumSubscription[]> {
  let page = 1;
  let pageLimit = 20;
  let querySearch: string | undefined;
  let queryStatus: string | undefined;
  let queryPlanId: string | undefined;

  if (typeof pageOrParams === "object") {
    page = pageOrParams.page ?? 1;
    pageLimit = pageOrParams.limit ?? 20;
    querySearch = pageOrParams.search;
    queryStatus = pageOrParams.subscriptionStatus;
    queryPlanId = pageOrParams.planId;
  } else {
    page = pageOrParams;
    pageLimit = limit;
    querySearch = search;
    queryStatus = subscriptionStatus;
    queryPlanId = planId;
  }

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(pageLimit));

  if (querySearch && querySearch.trim().length > 0) {
    query.set("search", querySearch.trim());
  }
  if (queryStatus && queryStatus !== "ALL") {
    query.set("subscriptionStatus", queryStatus);
  }
  if (queryPlanId && queryPlanId !== "ALL") {
    query.set("planId", queryPlanId);
  }

  const response = await api.get<SportiumSubscription[]>(
    `/api/owners/subscriptions?${query.toString()}`
  );
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Fetch Sportium's platform plans with their durations (public backend route GET /api/plans)
 */
export async function fetchPlatformPlans(): Promise<PlatformPlanWithDurations[]> {
  const response = await api.get<PlatformPlanWithDurations[]>("/api/plans?page=1&limit=50", { timeout: 10000 });
  return Array.isArray(response.data) ? response.data : [];
}

export type { SportiumSubscription, GymflowSubscription, PlatformPlanWithDurations };
