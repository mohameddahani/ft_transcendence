"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Bell,
  Calendar,
  CreditCard,
  AlertTriangle,
  Clock,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AdminNotification } from "@/types/notification";
import { fetchAdminNotification } from "@/lib/api/notifications";

interface NotificationDetailModalProps {
  notificationId: string | null;
  onClose: () => void;
}

export default function NotificationDetailModal({
  notificationId,
  onClose,
}: NotificationDetailModalProps) {
  const { t } = useTranslation();
  const [notification, setNotification] = useState<AdminNotification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!notificationId) {
      setNotification(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchAdminNotification(notificationId)
      .then((data) => {
        if (isMounted) setNotification(data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err?.response?.data?.message || "Failed to load notification details"
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [notificationId]);

  if (!notificationId) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PAYMENT_REMINDER":
        return <CreditCard className="w-5 h-5 text-emerald-500" />;
      case "MEMBERSHIP_EXPIRATION":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "SUBSCRIPTION_EXPIRATION":
        return <Clock className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "PAYMENT_REMINDER":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "MEMBERSHIP_EXPIRATION":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "SUBSCRIPTION_EXPIRATION":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-surface-bright rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/40 p-6 z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
              {notification ? (
                getTypeIcon(notification.notificationType)
              ) : (
                <Bell className="w-5 h-5 text-on-surface-variant" />
              )}
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-on-surface">
                {t("notificationDetails")}
              </h3>
              {notification && (
                <span
                  className={`mt-1 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getTypeBadgeClass(
                    notification.notificationType
                  )}`}
                >
                  {notification.notificationType.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-on-surface-variant gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Loading notification...</span>
            </div>
          )}

          {error && (
            <div className="py-6 text-center text-xs text-error">
              {error}
            </div>
          )}

          {!isLoading && notification && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40">
                <h4 className="font-bold text-sm text-on-surface">
                  {notification.title}
                </h4>
                <p className="mt-2 text-xs text-on-surface-variant leading-relaxed whitespace-pre-line">
                  {notification.message}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-on-surface-variant px-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {t("receivedAt")}: {new Date(notification.createdAt).toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Read
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
          >
            {t("close") || "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
