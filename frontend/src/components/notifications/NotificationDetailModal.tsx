"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Calendar,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AdminNotification } from "@/types/notification";
import {
  fetchAdminNotification,
  markAdminNotificationRead,
} from "@/lib/api/notifications";
import {
  fetchMemberNotificationById,
  markMemberNotificationRead,
} from "@/lib/api/member-portal";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";

interface NotificationDetailModalProps {
  notificationId: string | null;
  onClose: () => void;
  onNotificationRead?: (id: string) => void;
}

export default function NotificationDetailModal({
  notificationId,
  onClose,
  onNotificationRead,
}: NotificationDetailModalProps) {
  const { t } = useTranslation();
  const { role } = useCurrentUser();
  const isMember = role === "Member";

  const [mounted, setMounted] = useState(false);
  const [notification, setNotification] = useState<AdminNotification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (notificationId) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [notificationId, onClose]);

  useEffect(() => {
    if (!notificationId) {
      setNotification(null);
      return;
    }

    let isSubscribed = true;
    setIsLoading(true);
    setError(null);

    const fetchPromise = isMember
      ? fetchMemberNotificationById(notificationId)
      : fetchAdminNotification(notificationId);

    fetchPromise
      .then((data) => {
        if (!isSubscribed) return;
        setNotification(data);

        // If unread, mark it as read in backend and trigger callback
        if (!data.isRead) {
          const markPromise = isMember
            ? markMemberNotificationRead(notificationId)
            : markAdminNotificationRead(notificationId);

          markPromise
            .then(() => {
              if (isSubscribed) {
                setNotification((prev) => (prev ? { ...prev, isRead: true } : prev));
                onNotificationRead?.(notificationId);
              }
            })
            .catch(() => {
              // Silently catch already-read or network errors
            });
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          setError(
            err?.response?.data?.message || "Failed to load notification details"
          );
        }
      })
      .finally(() => {
        if (isSubscribed) setIsLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [notificationId, isMember, onNotificationRead]);

  if (!mounted || !notificationId) return null;

  const getTypeMicroBadge = (type?: string) => {
    switch (type) {
      case "PAYMENT_REMINDER":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Payment</span>
          </span>
        );
      case "MEMBERSHIP_EXPIRATION":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>Membership</span>
          </span>
        );
      case "SUBSCRIPTION_EXPIRATION":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>Subscription</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
            <span>Alert</span>
          </span>
        );
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-0 duration-150"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg toota-card border border-border/40 p-6 sm:p-7 shadow-2xl rounded-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 space-y-5 bg-card text-toota-ink">
        {/* Header - Baseline Metric style */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-border/40">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t("notificationDetails", "Notification Details")}
              </h2>
              {notification?.id && (
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / ID: {notification.id.slice(0, 8)}
                </span>
              )}
            </div>
            {notification && (
              <div>{getTypeMicroBadge(notification.notificationType)}</div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-toota-muted gap-2.5">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Loading details...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-xs text-center border border-destructive/20">
              {error}
            </div>
          )}

          {!isLoading && notification && (
            <div className="space-y-4">
              {/* Message Inner Box */}
              <div className="toota-inner border border-border/40 rounded-2xl p-5 space-y-2.5">
                <h3 className="text-sm sm:text-base font-semibold text-toota-ink tracking-tight">
                  {notification.title}
                </h3>
                <p className="text-xs sm:text-sm text-toota-muted leading-relaxed whitespace-pre-line">
                  {notification.message}
                </p>
              </div>

              {/* Metadata row */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-1.5 text-toota-muted">
                  <Calendar className="size-3.5 shrink-0" />
                  <span>
                    {t("receivedAt", "Received")}:{" "}
                    <span className="text-toota-ink font-medium">
                      {new Date(notification.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  <span>Read</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="toota-pill w-full h-10 text-xs font-semibold cursor-pointer border-border/60 hover:bg-toota-inner text-toota-ink"
          >
            {t("close", "Close")}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
