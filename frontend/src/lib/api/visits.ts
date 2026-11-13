import api from "@/lib/axios";
import axios from "axios";
import { TodayVisit } from "@/types/visit";

export async function fetchTodayVisits(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<TodayVisit[]> {
  try {
    let url = `/api/admins/visits/today?page=${page}&limit=${limit}`;
    if (search && search.trim().length > 0) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    const response = await api.get<TodayVisit[]>(url);
    return Array.isArray(response.data) ? response.data : [];
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return [];
    }
    throw err;
  }
}

export async function fetchVisitById(id: string): Promise<TodayVisit> {
  const response = await api.get<TodayVisit>(`/api/admins/visits/today/${id}`);
  return response.data;
}

export async function checkInManual(memberId: string): Promise<unknown> {
  const response = await api.post("/api/admins/attendances/check-in/manual", {
    memberId,
  });
  return response.data;
}

export async function checkInWithQr(rowToken: string): Promise<unknown> {
  const response = await api.post("/api/admins/attendances/check-in/qr", {
    rowToken,
  });
  return response.data;
}
