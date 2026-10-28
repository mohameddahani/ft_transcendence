import api from "@/lib/axios";
import { GymflowSubscription } from "@/types/subscription";

/**
 * Fetch the admin's current active GymFlow platform subscription
 */
export async function fetchMySubscription(): Promise<GymflowSubscription | null> {
  const response = await api.get<GymflowSubscription | null>(
    "/api/admins/subscriptions/me"
  );
  return response.data;
}

/**
 * Fetch all GymFlow subscriptions (history ledger) of the admin
 */
export async function fetchAllSubscriptions(
  page = 1,
  limit = 50
): Promise<GymflowSubscription[]> {
  const response = await api.get<GymflowSubscription[]>(
    `/api/admins/subscriptions/all?page=${page}&limit=${limit}`
  );
  return Array.isArray(response.data) ? response.data : [];
}
