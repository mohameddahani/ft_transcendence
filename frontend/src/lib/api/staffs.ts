import api from "@/lib/axios";
import { BackendStaff, AddStaffInput, UpdateStaffInput } from "@/types/staff";
import { getApiEndpoint } from "@/lib/api/config";
import { getCachedOrFetch, invalidateCache } from "@/lib/api/cache";

const CACHE_TTL_MS = 60_000;

export function invalidateStaffsCache() {
  invalidateCache("staffs:");
}

export async function fetchStaffs(
  page = 1,
  limit = 50,
  forceRefresh = false
): Promise<BackendStaff[]> {
  const cacheKey = `staffs:${page}:${limit}`;
  return getCachedOrFetch(
    cacheKey,
    async () => {
      const url = getApiEndpoint(`/api/admins/staffs?page=${page}&limit=${limit}`);
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
    forceRefresh
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
