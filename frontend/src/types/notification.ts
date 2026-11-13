export type NotificationType =
  | "PAYMENT_REMINDER"
  | "MEMBERSHIP_EXPIRATION"
  | "SUBSCRIPTION_EXPIRATION"
  | "CUSTOM";

export interface AdminNotification {
  id: string;
  adminId: string;
  notificationType: NotificationType | string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
