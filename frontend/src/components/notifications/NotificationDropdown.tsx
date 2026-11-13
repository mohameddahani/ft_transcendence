"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, useId } from "react";
import {
  Bell,
  CheckCheck,
  RefreshCw,
  CreditCard,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AdminNotification } from "@/types/notification";
import {
  fetchAdminNotifications,
  markAllAdminNotificationsRead,
  markAdminNotificationRead,
} from "@/lib/api/notifications";
import {
  fetchMemberNotifications,
  markAllMemberNotificationsRead,
  markMemberNotificationRead,
} from "@/lib/api/member-portal";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import NotificationDetailModal from "./NotificationDetailModal";

export default function NotificationDropdown() {
  const { t } = useTranslation();
  const { role, isLoading: isRoleLoading } = useCurrentUser();
  const isMember = role === "Member";

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownId = useId();

  // Fetch notifications
  const loadNotifications = useCallback(
    async (showLoading = true, forMember = isMember) => {
      if (showLoading) setIsLoading(true);
      try {
        const data = forMember
          ? await fetchMemberNotifications(1, 30)
          : await fetchAdminNotifications(1, 30);
        setNotifications(data);
      } catch {
        // Fail silently if unauthorized or offline
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [isMember]
  );

  // Initial fetch and periodic polling every 45s (only after role is known)
  useEffect(() => {
    if (!isRoleLoading && role) {
      const memberMode = role === "Member";
      loadNotifications(true, memberMode);

      const interval = setInterval(() => {
        loadNotifications(false, memberMode);
      }, 45000);

      return () => clearInterval(interval);
    }
  }, [role, isRoleLoading, loadNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate unread count strictly based on backend isRead status
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Handle clicking a single notification item
  const handleItemClick = async (item: AdminNotification) => {
    setSelectedNotificationId(item.id);
    setIsOpen(false);

    if (!item.isRead) {
      // Optimistically mark as read in local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );

      try {
        if (isMember) {
          await markMemberNotificationRead(item.id);
        } else {
          await markAdminNotificationRead(item.id);
        }
      } catch {
        // Silently catch already-read or network errors
      }
    }
  };

  // Handle Mark All As Read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    // Optimistically mark all as read in local state
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      if (isMember) {
        await markAllMemberNotificationsRead();
      } else {
        await markAllAdminNotificationsRead();
      }
    } catch {
      // Silently catch already-read or network errors
    }
  };

  // Helper for relative time
  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return t("justNow", "Just now");
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PAYMENT_REMINDER":
        return <CreditCard className="size-4 text-emerald-500" />;
      case "MEMBERSHIP_EXPIRATION":
        return <AlertTriangle className="size-4 text-amber-500" />;
      case "SUBSCRIPTION_EXPIRATION":
        return <Clock className="size-4 text-orange-500" />;
      default:
        return <Bell className="size-4 text-primary" />;
    }
  };

  return (
    <>
      <div ref={containerRef} className="static sm:relative">
        {/* Notification Bell Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={t("notifications", "Notifications")}
          aria-expanded={isOpen}
          aria-controls={isOpen ? dropdownId : undefined}
          title={t("notifications", "Notifications")}
          className="p-2.5 hover:bg-muted rounded-full text-toota-muted hover:text-toota-ink transition-colors relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="size-5" />

          {/* Unread Count Badge */}
          {unreadCount > 0 && (
            <span
              className="absolute top-1 end-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs border-2 border-background animate-in zoom-in-50 duration-200 pointer-events-none"
              title={`${unreadCount} ${t("unreadNotifications", "unread")}`}
            >
              {unreadCount > 9 ? "+9" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <Card
            id={dropdownId}
            role="region"
            aria-label={t("notifications", "Notifications")}
            className="rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl p-0 overflow-hidden w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-2rem)] flex flex-col z-50 absolute top-full end-4 sm:end-0 mt-3 animate-in fade-in-0 zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="px-4 py-4 border-b border-border flex flex-wrap items-center justify-between gap-2 bg-popover">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-bold text-sm text-toota-ink">
                  {t("notifications", "Notifications")}
                </span>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-toota-lime text-toota-side tabular-nums">
                    {unreadCount} {t("unreadNotifications", "unread")}
                  </span>
                ) : notifications.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground tabular-nums">
                    {notifications.length}
                  </span>
                ) : null}
              </div>

              <div className="ms-auto flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => loadNotifications(true)}
                  disabled={isLoading}
                  title={t("refresh", "Refresh")}
                  aria-label={t("refresh", "Refresh")}
                  className="p-2 rounded-full text-muted-foreground hover:text-popover-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RefreshCw
                    className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    title={t("markAllAsRead", "Mark all as read")}
                    aria-label={t("markAllAsRead", "Mark all as read")}
                    className="p-2 rounded-full text-muted-foreground hover:text-popover-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <CheckCheck className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[min(380px,60vh)] overflow-y-auto custom-scrollbar divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="py-12 px-6 text-center flex flex-col items-center justify-center space-y-2.5">
                  <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                    <Bell className="size-6 opacity-60" />
                  </div>
                  <p className="text-xs font-bold text-toota-ink">
                    {t("noNotifications", "No new notifications")}
                  </p>
                  <p className="text-[11px] text-toota-muted max-w-[200px]">
                    You are completely caught up! New alerts will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((item) => {
                  const isItemUnread = !item.isRead;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        "w-full p-4 text-start transition-colors cursor-pointer flex items-start gap-3 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        isItemUnread
                          ? "bg-toota-lime/10"
                          : "bg-popover"
                      )}
                    >
                      {/* Icon */}
                      <span className="size-9 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-border">
                        {getTypeIcon(item.notificationType)}
                      </span>

                      {/* Content */}
                      <span className="flex-1 min-w-0">
                        <span
                          className={cn(
                            "block text-[13px] leading-5 line-clamp-2 [overflow-wrap:anywhere]",
                            isItemUnread
                              ? "font-bold text-toota-ink"
                              : "font-medium text-toota-ink/80"
                          )}
                        >
                          {item.title}
                        </span>
                        <span className="block text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed [overflow-wrap:anywhere]">
                          {item.message}
                        </span>
                        <span className="block mt-2 text-[10px] text-muted-foreground font-medium">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </span>

                      {/* Unread indicator dot */}
                      {isItemUnread && (
                        <span className="size-2 rounded-full bg-toota-green shrink-0 mt-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-border bg-popover text-center">
                <span className="text-[10px] text-toota-muted font-medium">
                  Showing latest {notifications.length} alerts
                </span>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Single Notification Detail Modal */}
      <NotificationDetailModal
        notificationId={selectedNotificationId}
        onClose={() => setSelectedNotificationId(null)}
        onNotificationRead={(id) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
          );
        }}
      />
    </>
  );
}
