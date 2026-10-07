import api from "@/lib/axios";
import { BackendPayment } from "@/types/payment";
import { getApiEndpoint } from "@/lib/api/config";

export async function fetchPayments(
  page = 1,
  limit = 50
): Promise<BackendPayment[]> {
  const url = getApiEndpoint(`/api/admins/payments?page=${page}&limit=${limit}`);
  const response = await api.get<
    BackendPayment[] | { payments?: BackendPayment[]; data?: BackendPayment[] }
  >(url);

  const payload = response.data;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.payments)) {
    return payload.payments;
  }
  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }
  return [];
}

export async function fetchPayment(id: string): Promise<BackendPayment> {
  const url = getApiEndpoint(`/api/admins/payments/${id}`);
  const response = await api.get<BackendPayment>(url);
  return response.data;
}
