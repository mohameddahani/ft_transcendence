"use client";

import React from "react";
import {
  X,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Loader2,
} from "lucide-react";
import { TodayVisit } from "@/types/visit";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface VisitDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: TodayVisit | null;
  onConfirmCheckIn: (memberId: string) => Promise<void>;
  isCheckingIn: boolean;
}

export default function VisitDetailsModal({
  isOpen,
  onClose,
  visit,
  onConfirmCheckIn,
  isCheckingIn,
}: VisitDetailsModalProps) {
  const { t } = useTranslation();

  if (!isOpen || !visit) return null;

  const member = visit.member;
  const fullName =
    `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Member";
  const initials =
    `${(member.firstName || "")[0] || ""}${(member.lastName || "")[0] || ""}`.toUpperCase() ||
    "M";

  const candidatePhoto = member.photo || member.profileImage;
  const isDefaultImage =
    !candidatePhoto ||
    candidatePhoto === "default-image.jpg" ||
    candidatePhoto === "default-member-image.jpg";
  const photo = isDefaultImage ? null : candidatePhoto;

  const isReady = visit.visitStatus === "READY";
  const isCheckedIn = visit.visitStatus === "CHECKED_IN";
  const isCancelled = visit.visitStatus === "CANCELLED";

  const scheduledTime = visit.visitDateAndTime
    ? new Date(visit.visitDateAndTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  const scheduledDate = visit.visitDateAndTime
    ? new Date(visit.visitDateAndTime).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
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
      <div className="relative w-full max-w-lg toota-card border border-border/40 p-6 sm:p-7 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-border/40">
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {fullName}
              </h3>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {t("visitDetails", "visit dossier")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isReady && (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>{t("awaitingCheckIn", "Pending")}</span>
                </span>
              )}
              {isCheckedIn && (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{t("checkedIn", "Active")}</span>
                </span>
              )}
              {isCancelled && (
                <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{t("cancelled", "Expired")}</span>
                </span>
              )}
            </div>
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

        {/* Member Profile Snapshot */}
        <div className="flex items-center gap-4 p-4 rounded-2xl toota-inner border border-border/40">
          <div className="relative size-14 rounded-2xl overflow-hidden bg-toota-card border border-border/50 flex items-center justify-center shrink-0 shadow-inner">
            {photo ? (
              <img
                src={photo}
                alt={fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-mono text-lg font-bold text-toota-ink">
                {initials}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h4 className="text-sm font-semibold text-toota-ink truncate">
              {fullName}
            </h4>
            {member.phoneNumber && (
              <p className="text-xs text-toota-muted flex items-center gap-1.5 truncate">
                <Phone className="size-3.5 text-toota-muted shrink-0" />
                <span dir="ltr" className="font-mono">{member.phoneNumber}</span>
              </p>
            )}
            {member.email && (
              <p className="text-xs text-toota-muted flex items-center gap-1.5 truncate">
                <Mail className="size-3.5 text-toota-muted shrink-0" />
                <span className="truncate">{member.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Visit Timing & Membership Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Scheduled Arrival */}
          <div className="p-3.5 rounded-xl toota-inner border border-border/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-toota-muted font-medium">
              <Clock className="size-3.5 text-toota-muted shrink-0" />
              <span>{t("scheduledArrival", "Arrival Window")}</span>
            </div>
            <p className="text-sm font-bold font-mono text-toota-ink">{scheduledTime}</p>
            <p className="text-[11px] text-toota-muted font-mono">{scheduledDate}</p>
          </div>

          {/* Membership Tier */}
          <div className="p-3.5 rounded-xl toota-inner border border-border/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-toota-muted font-medium">
              <CreditCard className="size-3.5 text-toota-muted shrink-0" />
              <span>{t("membershipPlan", "Membership Plan")}</span>
            </div>
            <p className="text-sm font-bold text-toota-ink truncate">
              {visit.membership?.membershipPlan?.planName ||
                visit.membership?.membershipPlan?.name ||
                visit.membership?.plan?.planName ||
                (visit.membership ? t("standardPlan", "Standard Tier") : t("noActivePlan", "No Active Plan"))}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
              {visit.membership?.membershipStatus || visit.membership?.status || t("inGoodStanding", "Active & In Good Standing")}
            </p>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="toota-inner border border-border/40 p-4 rounded-2xl text-xs leading-relaxed flex items-start gap-3">
          {isReady && <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />}
          {isCheckedIn && <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />}
          {isCancelled && <AlertCircle className="size-4 text-rose-500 shrink-0 mt-0.5" />}

          <div className="space-y-0.5">
            <strong className="block font-semibold text-toota-ink">
              {isReady && (t("readyCheckInNotice", "Member arrived and awaiting verification"))}
              {isCheckedIn && (t("alreadyCheckedInNotice", "Member has completed check-in for today"))}
              {isCancelled && (t("visitCancelledNotice", "This scheduled visit was cancelled"))}
            </strong>
            <p className="text-[11px] text-toota-muted">
              {isReady && (t("clickConfirmToGrant", "Confirming attendance logs facility entry and validates the member pass."))}
              {isCheckedIn && (t("entryLogged", "Attendance recorded and member access verified."))}
              {isCancelled && (t("cancelledCannotEnter", "Cancelled visits cannot be validated. Re-schedule required."))}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isCheckingIn}
            className="toota-pill flex-1 h-11 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
          >
            <span>{t("close", "Close")}</span>
          </Button>

          {isReady && (
            <Button
              type="button"
              variant="outline"
              disabled={isCheckingIn}
              onClick={async () => {
                await onConfirmCheckIn(member.id);
                onClose();
              }}
              className="toota-pill flex-1 h-11 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
            >
              {isCheckingIn ? (
                <>
                  <Loader2 className="size-3.5 animate-spin me-1.5" />
                  <span>{t("verifying", "Confirming...")}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5 me-1.5 text-emerald-500" />
                  <span>{t("confirmAttendance", "Confirm Attendance")}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
