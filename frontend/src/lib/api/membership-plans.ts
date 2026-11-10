import api from "@/lib/axios";
import { getApiEndpoint } from "@/lib/api/config";
import { getCachedOrFetch, invalidateCache } from "@/lib/api/cache";
import {
  MembershipPlan,
  AddMembershipPlanInput,
  UpdateMembershipPlanInput,
  AddMembershipPlanDurationInput,
  UpdateMembershipPlanDurationInput,
} from "@/types/membership-plan";

const CACHE_TTL_MS = 60_000; // 1 minute in-memory cache

export function invalidatePlansCache() {
  invalidateCache("plans:");
}

export async function fetchMembershipPlans(
  page = 1,
  limit = 50,
  forceRefresh = false
): Promise<MembershipPlan[]> {
  const cacheKey = `plans:${page}:${limit}`;
  return getCachedOrFetch(
    cacheKey,
    async () => {
      const url = getApiEndpoint(`/api/membership-plans?page=${page}&limit=${limit}`);
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
    forceRefresh
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
): Promise<void> {
  const url = getApiEndpoint(`/api/membership-plans/durations/${id}`);
  await api.patch(url, data);
  invalidatePlansCache();
}
