"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Calendar,
  CreditCard,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AdminNotification } from "@/types/notification";
import { fetchAdminNotifications } from "@/lib/api/notifications";
import NotificationDetailModal from "./NotificationDetailModal";

const SEEN_STORAGE_KEY = "admin_seen_notifications";

export default function NotificationDropdown() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize seen IDs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEEN_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSeenIds(new Set(parsed));
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Fetch notifications
  const loadNotifications = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await fetchAdminNotifications(1, 30);
      setNotifications(data);
    } catch {
      // Fail silently if unauthorized or offline
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Initial fetch and periodic polling every 45s
  useEffect(() => {
    loadNotifications(true);

    const interval = setInterval(() => {
      loadNotifications(false);
    }, 45000);

    return () => clearInterval(interval);
  }, []);

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

  // Calculate unread count (notifications that are not read in backend AND not seen locally)
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead && !seenIds.has(n.id)).length;
  }, [notifications, seenIds]);

  // Mark all current notifications as seen when user opens the dropdown
  const handleOpenDropdown = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState && notifications.length > 0) {
      // Mark all current notifications as seen
      setSeenIds((prev) => {
        const updated = new Set(prev);
        notifications.forEach((n) => updated.add(n.id));
        try {
          localStorage.setItem(
            SEEN_STORAGE_KEY,
            JSON.stringify(Array.from(updated))
          );
        } catch {
          // Ignore storage errors
        }
        return updated;
      });
    }
  };

  const handleMarkAllAsRead = () => {
    setSeenIds((prev) => {
      const updated = new Set(prev);
      notifications.forEach((n) => updated.add(n.id));
      try {
        localStorage.setItem(
          SEEN_STORAGE_KEY,
          JSON.stringify(Array.from(updated))
        );
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  // Helper for relative time
  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return t("justNow") || "Just now";
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
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case "MEMBERSHIP_EXPIRATION":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "SUBSCRIPTION_EXPIRATION":
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <>
      <div ref={containerRef} className="relative">
        {/* Notification Bell Button */}
        <button
          type="button"
          onClick={handleOpenDropdown}
          aria-label={t("notifications")}
          title={t("notifications")}
          className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-all relative cursor-pointer"
        >
          <Bell className="w-5 h-5 text-on-surface-variant" />

          {/* Unread Count Badge */}
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-error text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md border-2 border-surface animate-in zoom-in-50 duration-200 pointer-events-none"
              title={`${unreadCount} ${t("unreadNotifications") || "unread"}`}
            >
              {unreadCount > 9 ? "+9" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface-bright/95 dark:bg-surface-container-low/95 backdrop-blur-xl border border-outline-variant/60 shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-outline-variant/50 flex items-center justify-between bg-surface-container-lowest/60">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-on-surface font-headline">
                  {t("notifications")}
                </span>
                {notifications.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary">
                    {notifications.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => loadNotifications(true)}
                  disabled={isLoading}
                  title={t("refresh")}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>

                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    title={t("markAllAsRead")}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-outline-variant/20">
              {notifications.length === 0 ? (
                <div className="py-12 px-6 text-center flex flex-col items-center justify-center space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                    <Bell className="w-6 h-6 opacity-60" />
                  </div>
                  <p className="text-xs font-semibold text-on-surface">
                    {t("noNotifications")}
                  </p>
                  <p className="text-[11px] text-on-surface-variant/80 max-w-[200px]">
                    You are completely caught up! New alerts will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((item) => {
                  const isItemUnread = !item.isRead && !seenIds.has(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedNotificationId(item.id)}
                      className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-surface-container-high/50 ${
                        isItemUnread
                          ? "bg-primary/5 dark:bg-primary/10"
                          : "bg-transparent"
                      }`}
                    >
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 mt-0.5">
                        {getTypeIcon(item.notificationType)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-on-surface truncate">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-on-surface-variant shrink-0">
                            {formatTimeAgo(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      </div>

                      {/* Unread indicator dot */}
                      {isItemUnread && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-outline-variant/40 bg-surface-container-lowest/80 text-center">
                <span className="text-[10px] text-on-surface-variant">
                  Showing latest {notifications.length} alerts
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Single Notification Detail Modal */}
      <NotificationDetailModal
        notificationId={selectedNotificationId}
        onClose={() => setSelectedNotificationId(null)}
      />
    </>
  );
}
