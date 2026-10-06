import api from "@/lib/axios";
import { TodayVisit } from "@/types/visit";

export async function fetchTodayVisits(
  page: number = 1,
  limit: number = 50
): Promise<TodayVisit[]> {
  const response = await api.get<TodayVisit[]>(
    `/api/admins/visits/today?page=${page}&limit=${limit}`
  );
  return Array.isArray(response.data) ? response.data : [];
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
