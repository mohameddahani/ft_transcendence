"use client";

import React, { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";
import { TodayVisit } from "@/types/visit";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface SuccessCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: TodayVisit | null;
  method?: "QR" | "MANUAL";
}

export default function SuccessCelebrationModal({
  isOpen,
  onClose,
  visit,
  method = "QR",
}: SuccessCelebrationModalProps) {
  const { t } = useTranslation();

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !visit) return null;

  const member = visit.member;
  const fullName =
    `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Member";

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

      {/* Simple Clean Modal Card */}
      <div className="relative w-full max-w-sm toota-card border border-border/40 p-6 sm:p-7 shadow-2xl rounded-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 text-center space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="size-4" />
        </button>

        {/* Clean Static Checkmark */}
        <div className="size-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="size-6" />
        </div>

        {/* Method Badge */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>
              {method === "QR"
                ? t("qrPassValidated", "Active")
                : t("manualEntryApproved", "Active")}
            </span>
          </span>
        </div>

        {/* Simple Message */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold tracking-tight text-toota-ink">
            {t("checkInSuccess", "Check-in Confirmed")}
          </h3>
          <p className="text-xs font-semibold text-toota-ink truncate">
            {fullName}
          </p>
          <p className="text-xs text-toota-muted">
            {(visit.membership?.membershipPlan?.planName ||
              visit.membership?.membershipPlan?.name ||
              visit.membership?.plan?.planName ||
              (visit.membership ? t("standardPlan", "Standard Tier") : t("noActivePlan", "No Active Plan")))} •{" "}
            {t("facilityAccessGranted", "Facility access granted")}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="toota-pill w-full h-10 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
          >
            {t("done", "Done")}
          </Button>
        </div>
      </div>
    </div>
  );
}
