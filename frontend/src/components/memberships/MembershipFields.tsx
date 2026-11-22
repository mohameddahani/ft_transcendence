import React from "react";
import { MembershipStatus, MembershipPlanDuration } from "@/types/membership";
import { useTranslation } from "react-i18next";

export function MembershipStatusBadge({
  status,
}: {
  status?: MembershipStatus | string;
}) {
  const { t } = useTranslation();
  const normalized = (status || "").toUpperCase();

  switch (normalized) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-emerald-200 dark:ring-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{t("active", "Active")}</span>
        </span>
      );
    case "EXPIRED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
          <span className="size-1.5 rounded-full bg-zinc-400 shrink-0" />
          <span>{t("expired", "Expired")}</span>
        </span>
      );
    case "CANCELLED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-rose-200 dark:ring-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400">
          <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{t("cancelled", "Cancelled")}</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
          <span className="size-1.5 rounded-full bg-zinc-400 shrink-0" />
          <span>{status || "—"}</span>
        </span>
      );
  }
}

export function formatDurationString(
  duration?: MembershipPlanDuration | string | null
): string {
  if (!duration) return "—";
  if (typeof duration === "string") return duration;
  if (typeof duration === "object") {
    if (typeof duration.durationDays === "number") {
      if (duration.durationDays === 30) return "1 Month (30 Days)";
      if (duration.durationDays === 90) return "3 Months (90 Days)";
      if (duration.durationDays === 180) return "6 Months (180 Days)";
      if (duration.durationDays === 365) return "1 Year (365 Days)";
      return `${duration.durationDays} Days`;
    }
    if (duration.duration) return duration.duration;
  }
  return "—";
}

