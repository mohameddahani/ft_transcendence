"use client";

import React from "react";
import {
  X,
  User,
  Calendar,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
} from "lucide-react";
import { TodayVisit } from "@/types/visit";
import { useTranslation } from "react-i18next";

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
  const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Member";
  const initials = `${(member.firstName || "")[0] || ""}${(member.lastName || "")[0] || ""}`.toUpperCase() || "M";
  
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-surface-bright rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/60 p-6 z-10 animate-in zoom-in-95 duration-200 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-outline-variant/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {t("visitDetails") || "Visit & Member Dossier"}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isReady
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : isCheckedIn
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                }`}
              >
                {visit.visitStatus}
              </span>
            </div>
            <h3 className="font-headline text-lg font-bold text-on-surface mt-1">
              {fullName}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Profile Snapshot */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/40">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 border border-outline-variant/50">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-headline text-xl font-bold text-primary">
                {initials}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h4 className="font-bold text-sm text-on-surface truncate">
              {fullName}
            </h4>
            {member.phoneNumber && (
              <p className="text-xs text-on-surface-variant flex items-center gap-1.5 truncate">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                <span dir="ltr">{member.phoneNumber}</span>
              </p>
            )}
            {member.email && (
              <p className="text-xs text-on-surface-variant flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{member.email}</span>
              </p>
            )}
          </div>
        </div>

        {/* Visit Timing & Membership Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Scheduled Arrival */}
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40 space-y-1">
            <div className="flex items-center gap-1.5 text-on-surface-variant font-semibold">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{t("scheduledArrival") || "Arrival Window"}</span>
            </div>
            <p className="text-sm font-bold text-on-surface">{scheduledTime}</p>
            <p className="text-[11px] text-on-surface-variant">{scheduledDate}</p>
          </div>

          {/* Membership Tier */}
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40 space-y-1">
            <div className="flex items-center gap-1.5 text-on-surface-variant font-semibold">
              <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t("membershipPlan") || "Membership Plan"}</span>
            </div>
            <p className="text-sm font-bold text-on-surface truncate">
              {visit.membership?.plan?.planName || "Active Membership"}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {visit.membership?.status || "In Good Standing"}
            </p>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div
          className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
            isReady
              ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
              : isCheckedIn
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
              : "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
          }`}
        >
          {isReady && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
          {isCheckedIn && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
          {isCancelled && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}

          <div>
            <strong className="block font-semibold">
              {isReady && (t("readyCheckInNotice") || "Member arrived and awaiting verification")}
              {isCheckedIn && (t("alreadyCheckedInNotice") || "Member has already completed check-in for today")}
              {isCancelled && (t("visitCancelledNotice") || "This scheduled visit was cancelled")}
            </strong>
            <p className="text-[11px] mt-0.5 opacity-90">
              {isReady && (t("clickConfirmToGrant") || "Confirming attendance creates the entry log and grants facility access.")}
              {isCheckedIn && (t("entryLogged") || "Attendance recorded and member QR badge validated.")}
              {isCancelled && (t("cancelledCannotEnter") || "Cancelled visits cannot be validated. Re-schedule required.")}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
          >
            {t("close") || "Close"}
          </button>

          {isReady && (
            <button
              type="button"
              disabled={isCheckingIn}
              onClick={async () => {
                await onConfirmCheckIn(member.id);
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl primary-gradient text-white text-xs font-bold shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isCheckingIn
                  ? t("verifying") || "Confirming..."
                  : t("confirmAttendance") || "Confirm Attendance"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
