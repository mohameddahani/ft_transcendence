import api from "@/lib/axios";
import { BackendStaff, AddStaffInput, UpdateStaffInput } from "@/types/staff";
import { getApiEndpoint } from "@/lib/api/config";
import { getCachedOrFetch, invalidateCache } from "@/lib/api/cache";

const CACHE_TTL_MS = 60_000;

export function invalidateStaffsCache() {
  invalidateCache("staffs:");
}

export interface FetchStaffsParams {
  page?: number;
  limit?: number;
  search?: string;
  accountStatus?: string;
}

export async function fetchStaffs(
  pageOrParams: number | FetchStaffsParams = 1,
  limit = 20,
  search?: string,
  accountStatus?: string,
  forceRefresh = false
): Promise<BackendStaff[]> {
  let page = 1;
  let pageLimit = 20;
  let querySearch: string | undefined;
  let queryStatus: string | undefined;
  const shouldForce = forceRefresh;

  if (typeof pageOrParams === "object") {
    page = pageOrParams.page ?? 1;
    pageLimit = pageOrParams.limit ?? 20;
    querySearch = pageOrParams.search;
    queryStatus = pageOrParams.accountStatus;
  } else {
    page = pageOrParams;
    pageLimit = limit;
    querySearch = search;
    queryStatus = accountStatus;
  }

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(pageLimit));
  if (querySearch && querySearch.trim()) {
    query.set("search", querySearch.trim());
  }
  if (queryStatus && queryStatus !== "ALL") {
    query.set("accountStatus", queryStatus);
  }

  const cacheKey = `staffs:${query.toString()}`;
  return getCachedOrFetch(
    cacheKey,
    async () => {
      const endpoint = `/api/admins/staffs?${query.toString()}`;
      const url = getApiEndpoint(endpoint);
      const response = await api.get<BackendStaff[] | { staffs?: BackendStaff[]; data?: BackendStaff[] }>(url);

      const payload = response.data;
      if (Array.isArray(payload)) {
        return payload;
      }
      if (payload && Array.isArray(payload.staffs)) {
        return payload.staffs;
      }
      if (payload && Array.isArray(payload.data)) {
        return payload.data;
      }
      return [];
    },
    CACHE_TTL_MS,
    shouldForce
  );
}

export async function fetchStaff(id: string): Promise<BackendStaff> {
  const url = getApiEndpoint(`/api/admins/staffs/${id}`);
  const response = await api.get<BackendStaff>(url);
  return response.data;
}

export async function createStaff(data: AddStaffInput): Promise<BackendStaff> {
  const url = getApiEndpoint("/api/admins/staffs");
  const response = await api.post<BackendStaff>(url, data);
  invalidateStaffsCache();
  return response.data;
}

export async function updateStaff(id: string, data: UpdateStaffInput): Promise<BackendStaff> {
  const url = getApiEndpoint(`/api/admins/staffs/${id}`);
  const response = await api.patch<BackendStaff>(url, data);
  invalidateStaffsCache();
  return response.data;
}

export async function activeStaff(id: string): Promise<void> {
  const url = getApiEndpoint(`/api/admins/staffs/active/${id}`);
  await api.patch(url, {});
  invalidateStaffsCache();
}

export async function pendingStaff(id: string): Promise<void> {
  const url = getApiEndpoint(`/api/admins/staffs/pending/${id}`);
  await api.patch(url, {});
  invalidateStaffsCache();
}

export async function banStaff(id: string): Promise<void> {
  const url = getApiEndpoint(`/api/admins/staffs/ban/${id}`);
  await api.patch(url, {});
  invalidateStaffsCache();
}
