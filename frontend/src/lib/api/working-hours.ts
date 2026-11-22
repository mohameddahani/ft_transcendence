import api from "@/lib/axios";
import {
  WorkingHour,
  AddWorkingHourInput,
  UpdateWorkingHourInput,
  SpecialHour,
  AddSpecialHourInput,
  UpdateSpecialHourInput,
} from "@/types/working-hours";
import { getApiEndpoint } from "@/lib/api/config";
import { getCachedOrFetch, invalidateCache } from "@/lib/api/cache";

const CACHE_TTL_MS = 60_000;

export function invalidateWorkingHoursCache() {
  invalidateCache("working-hours:");
  invalidateCache("special-hours:");
}

// ==========================================
// Working Hours (Weekly Schedule)
// ==========================================

export interface FetchWorkingHoursParams {
  page?: number;
  limit?: number;
  dayOfWeek?: number;
  isClosed?: boolean;
}

export async function fetchWorkingHours(
  pageOrParams: number | FetchWorkingHoursParams = 1,
  limit = 50,
  dayOfWeek?: number,
  isClosed?: boolean,
  forceRefresh = false
): Promise<WorkingHour[]> {
  let page = 1;
  let pageLimit = 50;
  let queryDayOfWeek: number | undefined;
  let queryIsClosed: boolean | undefined;

  if (typeof pageOrParams === "object") {
    page = pageOrParams.page ?? 1;
    pageLimit = pageOrParams.limit ?? 50;
    queryDayOfWeek = pageOrParams.dayOfWeek;
    queryIsClosed = pageOrParams.isClosed;
  } else {
    page = pageOrParams;
    pageLimit = limit;
    queryDayOfWeek = dayOfWeek;
    queryIsClosed = isClosed;
  }

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(pageLimit));
  if (queryDayOfWeek !== undefined) {
    query.set("dayOfWeek", String(queryDayOfWeek));
  }
  if (queryIsClosed !== undefined) {
    query.set("isClosed", String(queryIsClosed));
  }

  const cacheKey = `working-hours:${query.toString()}`;
  return getCachedOrFetch(
    cacheKey,
    async () => {
      const url = getApiEndpoint(`/api/admins/working-hours?${query.toString()}`);
      const response = await api.get<WorkingHour[] | { workingHours?: WorkingHour[]; data?: WorkingHour[] }>(url);

      const payload = response.data;
      if (Array.isArray(payload)) {
        return payload;
      }
      if (payload && Array.isArray(payload.workingHours)) {
        return payload.workingHours;
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

export async function fetchWorkingHour(id: string): Promise<WorkingHour> {
  const url = getApiEndpoint(`/api/admins/working-hours/${id}`);
  const response = await api.get<WorkingHour>(url);
  return response.data;
}

export async function createWorkingHour(
  data: AddWorkingHourInput
): Promise<WorkingHour> {
  const url = getApiEndpoint("/api/admins/working-hours");
  const response = await api.post<WorkingHour>(url, data);
  invalidateWorkingHoursCache();
  return response.data;
}

export async function updateWorkingHour(
  id: string,
  data: UpdateWorkingHourInput
): Promise<WorkingHour> {
  const url = getApiEndpoint(`/api/admins/working-hours/${id}`);
  const response = await api.patch<WorkingHour>(url, data);
  invalidateWorkingHoursCache();
  return response.data;
}

export async function deleteWorkingHour(id: string): Promise<void> {
  const url = getApiEndpoint(`/api/admins/working-hours/${id}`);
  await api.delete(url);
  invalidateWorkingHoursCache();
}

// ==========================================
// Special Hours (Holidays / Exceptional Closures)
// ==========================================

export interface FetchSpecialHoursParams {
  page?: number;
  limit?: number;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

export async function fetchSpecialHours(
  pageOrParams: number | FetchSpecialHoursParams = 1,
  limit = 50,
  from?: string,
  to?: string,
  forceRefresh = false
): Promise<SpecialHour[]> {
  let page = 1;
  let pageLimit = 50;
  let queryFrom: string | undefined;
  let queryTo: string | undefined;

  if (typeof pageOrParams === "object") {
    page = pageOrParams.page ?? 1;
    pageLimit = pageOrParams.limit ?? 50;
    queryFrom = pageOrParams.from;
    queryTo = pageOrParams.to;
  } else {
    page = pageOrParams;
    pageLimit = limit;
    queryFrom = from;
    queryTo = to;
  }

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(pageLimit));
  if (queryFrom && queryFrom.trim().length > 0) {
    query.set("from", queryFrom.trim());
  }
  if (queryTo && queryTo.trim().length > 0) {
    query.set("to", queryTo.trim());
  }

  const cacheKey = `special-hours:${query.toString()}`;
  return getCachedOrFetch(
    cacheKey,
    async () => {
      const url = getApiEndpoint(`/api/admins/special-hours?${query.toString()}`);
      const response = await api.get<SpecialHour[] | { specialHours?: SpecialHour[]; data?: SpecialHour[] }>(url);

      const payload = response.data;
      if (Array.isArray(payload)) {
        return payload;
      }
      if (payload && Array.isArray(payload.specialHours)) {
        return payload.specialHours;
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

export async function fetchSpecialHour(id: string): Promise<SpecialHour> {
  const url = getApiEndpoint(`/api/admins/special-hours/${id}`);
  const response = await api.get<SpecialHour>(url);
  return response.data;
}

export async function createSpecialHour(
  data: AddSpecialHourInput
): Promise<SpecialHour> {
  const url = getApiEndpoint("/api/admins/special-hours");
  const response = await api.post<SpecialHour>(url, data);
  invalidateWorkingHoursCache();
  return response.data;
}

export async function updateSpecialHour(
  id: string,
  data: UpdateSpecialHourInput
): Promise<SpecialHour> {
  const url = getApiEndpoint(`/api/admins/special-hours/${id}`);
  const response = await api.patch<SpecialHour>(url, data);
  invalidateWorkingHoursCache();
  return response.data;
}

export async function deleteSpecialHour(id: string): Promise<void> {
  const url = getApiEndpoint(`/api/admins/special-hours/${id}`);
  await api.delete(url);
  invalidateWorkingHoursCache();
}
