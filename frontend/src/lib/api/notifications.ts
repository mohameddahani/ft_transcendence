import api from "@/lib/axios";
import { AdminNotification } from "@/types/notification";

export interface FetchNotificationsParams {
  page?: number;
  limit?: number;
  search?: string;
  notificationType?: "PAYMENT_REMINDER" | "MEMBERSHIP_EXPIRATION" | "SUBSCRIPTION_EXPIRATION" | "CUSTOM" | string;
  isRead?: boolean;
}

/**
 * Fetch notifications for current authenticated admin with search, type, and read filters
 */
export async function fetchAdminNotifications(
  pageOrParams: number | FetchNotificationsParams = 1,
  limit: number = 20,
  search?: string,
  notificationType?: string,
  isRead?: boolean
): Promise<AdminNotification[]> {
  let page = 1;
  let pageLimit = 20;
  let querySearch: string | undefined;
  let queryType: string | undefined;
  let queryIsRead: boolean | undefined;

  if (typeof pageOrParams === "object") {
    page = pageOrParams.page ?? 1;
    pageLimit = pageOrParams.limit ?? 20;
    querySearch = pageOrParams.search;
    queryType = pageOrParams.notificationType;
    queryIsRead = pageOrParams.isRead;
  } else {
    page = pageOrParams;
    pageLimit = limit;
    querySearch = search;
    queryType = notificationType;
    queryIsRead = isRead;
  }

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(pageLimit));

  if (querySearch && querySearch.trim().length > 0) {
    query.set("search", querySearch.trim());
  }
  if (queryType && queryType !== "ALL") {
    query.set("notificationType", queryType);
  }
  if (queryIsRead !== undefined) {
    query.set("isRead", String(queryIsRead));
  }

  const response = await api.get<AdminNotification[]>(
    `/api/admins/notifications?${query.toString()}`
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
