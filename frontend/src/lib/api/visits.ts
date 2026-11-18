import api from "@/lib/axios";
import axios from "axios";
import { TodayVisit } from "@/types/visit";

export interface FetchTodayVisitsParams {
  page?: number;
  limit?: number;
  search?: string;
  visitStatus?: string;
}

export async function fetchTodayVisits(
  pageOrParams: number | FetchTodayVisitsParams = 1,
  limit: number = 20,
  search?: string,
  visitStatus?: string
): Promise<TodayVisit[]> {
  try {
    let page = 1;
    let pageLimit = 20;
    let querySearch: string | undefined;
    let queryStatus: string | undefined;

    if (typeof pageOrParams === "object") {
      page = pageOrParams.page ?? 1;
      pageLimit = pageOrParams.limit ?? 20;
      querySearch = pageOrParams.search;
      queryStatus = pageOrParams.visitStatus;
    } else {
      page = pageOrParams;
      pageLimit = limit;
      querySearch = search;
      queryStatus = visitStatus;
    }

    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("limit", String(pageLimit));
    if (querySearch && querySearch.trim()) {
      query.set("search", querySearch.trim());
    }
    if (queryStatus && queryStatus !== "ALL") {
      query.set("visitStatus", queryStatus);
    }

    const response = await api.get<TodayVisit[]>(`/api/admins/visits/today?${query.toString()}`);
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
