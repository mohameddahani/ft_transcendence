import api from "@/lib/axios";
import { BackendPayment } from "@/types/payment";
import { getApiEndpoint } from "@/lib/api/config";

export interface FetchPaymentsParams {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
}

export async function fetchPayments(
  pageOrParams: number | FetchPaymentsParams = 1,
  limit = 20,
  search?: string,
  from?: string,
  to?: string
): Promise<BackendPayment[]> {
  let page = 1;
  let pageLimit = 20;
  let querySearch: string | undefined;
  let queryFrom: string | undefined;
  let queryTo: string | undefined;

  if (typeof pageOrParams === "object") {
    page = pageOrParams.page ?? 1;
    pageLimit = pageOrParams.limit ?? 20;
    querySearch = pageOrParams.search;
    queryFrom = pageOrParams.from;
    queryTo = pageOrParams.to;
  } else {
    page = pageOrParams;
    pageLimit = limit;
    querySearch = search;
    queryFrom = from;
    queryTo = to;
  }

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(pageLimit));

  if (querySearch && querySearch.trim().length > 0) {
    query.set("search", querySearch.trim());
  }
  if (queryFrom && queryFrom.trim().length > 0) {
    query.set("from", queryFrom.trim());
  }
  if (queryTo && queryTo.trim().length > 0) {
    query.set("to", queryTo.trim());
  }

  const endpoint = `/api/admins/payments?${query.toString()}`;
  const url = getApiEndpoint(endpoint);
  const response = await api.get<
    BackendPayment[] | { payments?: BackendPayment[]; data?: BackendPayment[] }
  >(url);
  const payload = response.data;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    if (Array.isArray((payload as { data?: BackendPayment[] }).data)) {
      return (payload as { data?: BackendPayment[] }).data!;
    }
    if (Array.isArray((payload as { payments?: BackendPayment[] }).payments)) {
      return (payload as { payments?: BackendPayment[] }).payments!;
    }
  }
  return [];
}

export async function fetchPayment(id: string): Promise<BackendPayment> {
  const url = getApiEndpoint(`/api/admins/payments/${id}`);
  const response = await api.get<BackendPayment>(url);
  return response.data;
}
