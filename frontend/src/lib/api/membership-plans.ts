import api from "@/lib/axios";
import { getApiEndpoint } from "@/lib/api/config";
import { getCachedOrFetch, invalidateCache } from "@/lib/api/cache";
import {
  MembershipPlan,
  AddMembershipPlanInput,
  UpdateMembershipPlanInput,
  AddMembershipPlanDurationInput,
  UpdateMembershipPlanDurationInput,
  MembershipPlanDuration,
} from "@/types/membership-plan";

const CACHE_TTL_MS = 60_000; // 1 minute in-memory cache

export function invalidatePlansCache() {
  invalidateCache("plans:");
}

export interface FetchMembershipPlansParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export async function fetchMembershipPlans(
  pageOrParams: number | FetchMembershipPlansParams = 1,
  limit = 50,
  forceRefresh = false
): Promise<MembershipPlan[]> {
  let page = 1;
  let pageLimit = 50;
  let search: string | undefined;
  let isActive: boolean | undefined;
  const shouldForce = forceRefresh;

  if (typeof pageOrParams === "object") {
    page = pageOrParams.page ?? 1;
    pageLimit = pageOrParams.limit ?? 50;
    search = pageOrParams.search;
    isActive = pageOrParams.isActive;
  } else {
    page = pageOrParams;
    pageLimit = limit;
  }

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(pageLimit));
  if (search && search.trim()) {
    query.set("search", search.trim());
  }
  if (typeof isActive === "boolean") {
    query.set("isActive", String(isActive));
  }

  const cacheKey = `plans:${query.toString()}`;
  return getCachedOrFetch(
    cacheKey,
    async () => {
      const url = getApiEndpoint(`/api/membership-plans?${query.toString()}`);
      const response = await api.get<MembershipPlan[] | { data?: MembershipPlan[] }>(url);
      const data = response.data;
      let result: MembershipPlan[] = [];
      if (Array.isArray(data)) result = data;
      else if (data && typeof data === "object" && Array.isArray(data.data)) {
        result = data.data;
      }
      return result;
    },
    CACHE_TTL_MS,
    shouldForce
  );
}

export async function fetchMembershipPlan(id: string): Promise<MembershipPlan> {
  const url = getApiEndpoint(`/api/membership-plans/${id}`);
  const response = await api.get<MembershipPlan>(url);
  return response.data;
}

export async function createMembershipPlan(
  data: AddMembershipPlanInput
): Promise<void> {
  const url = getApiEndpoint("/api/membership-plans");
  await api.post(url, data);
  invalidatePlansCache();
}

export async function updateMembershipPlan(
  id: string,
  data: UpdateMembershipPlanInput
): Promise<void> {
  const url = getApiEndpoint(`/api/membership-plans/${id}`);
  await api.patch(url, data);
  invalidatePlansCache();
}

export async function deleteMembershipPlan(id: string): Promise<void> {
  const url = getApiEndpoint(`/api/membership-plans/${id}`);
  await api.delete(url);
  invalidatePlansCache();
}

export async function addMembershipPlanDuration(
  data: AddMembershipPlanDurationInput
): Promise<void> {
  const url = getApiEndpoint("/api/membership-plans/durations");
  await api.post(url, data);
  invalidatePlansCache();
}

export async function updateMembershipPlanDuration(
  id: string,
  data: UpdateMembershipPlanDurationInput
): Promise<MembershipPlanDuration> {
  const url = getApiEndpoint(`/api/membership-plans/durations/${id}`);
  const response = await api.patch<MembershipPlanDuration>(url, data);
  invalidatePlansCache();
  return response.data;
}

export async function deleteMembershipPlanDuration(id: string): Promise<void> {
  const url = getApiEndpoint(`/api/membership-plans/durations/${id}`);
  await api.delete(url);
  invalidatePlansCache();
}

export async function toggleMembershipPlanDurationActive(
  id: string,
  membershipPlanId: string,
  isActive: boolean
): Promise<MembershipPlanDuration> {
  const url = getApiEndpoint(`/api/membership-plans/durations/${id}`);
  const response = await api.patch<MembershipPlanDuration>(url, {
    membershipPlanId,
    isActive,
  });
  invalidatePlansCache();
  return response.data;
}
