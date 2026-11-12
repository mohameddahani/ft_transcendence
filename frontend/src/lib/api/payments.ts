import api from "@/lib/axios";
import { BackendPayment } from "@/types/payment";
import { getApiEndpoint } from "@/lib/api/config";

export async function fetchPayments(
  page = 1,
  limit = 20,
  search?: string
): Promise<BackendPayment[]> {
  let endpoint = `/api/admins/payments?page=${page}&limit=${limit}`;
  if (search && search.trim().length > 0) {
    endpoint += `&search=${encodeURIComponent(search.trim())}`;
  }
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
