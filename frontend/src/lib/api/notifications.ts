import api from "@/lib/axios";
import { AdminNotification } from "@/types/notification";

/**
 * Fetch all notifications for current authenticated admin
 */
export async function fetchAdminNotifications(
  page: number = 1,
  limit: number = 20
): Promise<AdminNotification[]> {
  const response = await api.get<AdminNotification[]>(
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
  const response = await api.get<AdminNotification>(
    `/api/admins/notifications/${id}`
  );
  return response.data;
}

/**
 * Mark all admin notifications as read
 */
export async function markAllAdminNotificationsRead(): Promise<void> {
  await api.patch("/api/admins/notifications");
}

/**
 * Mark single admin notification as read
 */
export async function markAdminNotificationRead(id: string): Promise<void> {
  await api.patch(`/api/admins/notifications/${id}`);
}
