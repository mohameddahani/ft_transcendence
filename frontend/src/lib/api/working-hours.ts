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

// ==========================================
// Working Hours (Weekly Schedule)
// ==========================================

export async function fetchWorkingHours(
  page = 1,
  limit = 50
): Promise<WorkingHour[]> {
  const url = getApiEndpoint(`/api/admins/working-hours?page=${page}&limit=${limit}`);
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
  return response.data;
}

export async function updateWorkingHour(
  id: string,
  data: UpdateWorkingHourInput
): Promise<WorkingHour> {
  const url = getApiEndpoint(`/api/admins/working-hours/${id}`);
  const response = await api.patch<WorkingHour>(url, data);
  return response.data;
}

export async function deleteWorkingHour(id: string): Promise<void> {
  const url = getApiEndpoint(`/api/admins/working-hours/${id}`);
  await api.delete(url);
}

// ==========================================
// Special Hours (Holidays / Exceptional Closures)
// ==========================================

export async function fetchSpecialHours(
  page = 1,
  limit = 50
): Promise<SpecialHour[]> {
  const url = getApiEndpoint(`/api/admins/special-hours?page=${page}&limit=${limit}`);
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
  return response.data;
}

export async function updateSpecialHour(
  id: string,
  data: UpdateSpecialHourInput
): Promise<SpecialHour> {
  const url = getApiEndpoint(`/api/admins/special-hours/${id}`);
  const response = await api.patch<SpecialHour>(url, data);
  return response.data;
}

export async function deleteSpecialHour(id: string): Promise<void> {
  const url = getApiEndpoint(`/api/admins/special-hours/${id}`);
  await api.delete(url);
}
