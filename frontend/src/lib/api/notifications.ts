import axios from "axios";
import { AdminNotification } from "@/types/notification";

/**
 * Fetch all notifications for current authenticated admin
 */
export async function fetchAdminNotifications(
  page: number = 1,
  limit: number = 20
): Promise<AdminNotification[]> {
  const response = await axios.get<AdminNotification[]>(
    `/api/admins/notifications?page=${page}&limit=${limit}`
  );
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Fetch a single notification by ID
 */
export async function fetchAdminNotification(
  id: string
): Promise<AdminNotification> {
  const response = await axios.get<AdminNotification>(
    `/api/admins/notifications/${id}`
  );
  return response.data;
}
