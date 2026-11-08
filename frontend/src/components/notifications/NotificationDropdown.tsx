"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
      <div ref={containerRef} className="relative">
        {/* Notification Bell Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={t("notifications", "Notifications")}
          title={t("notifications", "Notifications")}
          className="p-2.5 hover:bg-toota-inner rounded-full text-toota-muted hover:text-toota-ink transition-all relative cursor-pointer"
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
          <Card className="toota-card border border-border/40 shadow-2xl p-0 overflow-hidden w-80 sm:w-96 flex flex-col z-50 absolute right-0 rtl:right-auto rtl:left-0 mt-2 animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between bg-toota-inner/40">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-toota-ink">
                  {t("notifications", "Notifications")}
                </span>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                    {unreadCount} {t("unreadNotifications", "unread")}
                  </span>
                ) : notifications.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-toota-inner text-toota-muted">
                    {notifications.length}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => loadNotifications(true)}
                  disabled={isLoading}
                  title={t("refresh", "Refresh")}
                  className="p-1.5 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer disabled:opacity-50"
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
                    className="p-1.5 rounded-lg text-toota-muted hover:text-primary hover:bg-toota-inner transition-colors cursor-pointer"
                  >
                    <CheckCheck className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-border/20">
              {notifications.length === 0 ? (
                <div className="py-12 px-6 text-center flex flex-col items-center justify-center space-y-2.5">
                  <div className="size-12 rounded-2xl bg-toota-inner flex items-center justify-center text-toota-muted shadow-inner">
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
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        "p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-toota-inner/60",
                        isItemUnread
                          ? "bg-primary/[0.04] dark:bg-primary/[0.08]"
                          : "bg-transparent"
                      )}
                    >
                      {/* Icon */}
                      <div className="size-8 rounded-xl bg-toota-inner flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        {getTypeIcon(item.notificationType)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4
                            className={cn(
                              "text-xs truncate",
                              isItemUnread
                                ? "font-bold text-toota-ink"
                                : "font-medium text-toota-ink/80"
                            )}
                          >
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-toota-muted shrink-0 font-medium">
                            {formatTimeAgo(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-toota-muted mt-1 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      </div>

                      {/* Unread indicator dot */}
                      {isItemUnread && (
                        <span className="size-2 rounded-full bg-primary shrink-0 mt-2 shadow-xs" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-border/40 bg-toota-inner/20 text-center">
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
