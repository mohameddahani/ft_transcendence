import api from "@/lib/axios";
import { SportiumSubscription, GymflowSubscription } from "@/types/subscription";

/**
 * Fetch the admin's current active Sportium platform subscription
 */
export async function fetchMySubscription(): Promise<SportiumSubscription | null> {
  const response = await api.get<SportiumSubscription | null>(
    "/api/admins/subscriptions/me"
  );
  return response.data;
}

/**
 * Fetch all Sportium subscriptions (history ledger) of the admin
 */
export async function fetchAllSubscriptions(
  page = 1,
  limit = 50
): Promise<SportiumSubscription[]> {
  const response = await api.get<SportiumSubscription[]>(
    `/api/admins/subscriptions/all?page=${page}&limit=${limit}`
  );
  return Array.isArray(response.data) ? response.data : [];
}

export type { SportiumSubscription, GymflowSubscription };
