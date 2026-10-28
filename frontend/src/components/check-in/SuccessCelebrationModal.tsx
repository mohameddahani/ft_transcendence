"use client";

import React, { useEffect } from "react";
import { CheckCircle2, Sparkles, User, X } from "lucide-react";
import { TodayVisit } from "@/types/visit";
import { useTranslation } from "react-i18next";

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

  // Auto-dismiss after 3.5 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !visit) return null;

  const member = visit.member;
  const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Member";
  const initials = `${(member.firstName || "")[0] || ""}${(member.lastName || "")[0] || ""}`.toUpperCase() || "M";
  const photo = member.photo || member.profileImage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 pointer-events-none">
      <div className="relative w-full max-w-sm bg-surface-bright rounded-3xl shadow-2xl border-2 border-emerald-500/40 p-6 z-10 animate-in zoom-in-95 duration-200 text-center space-y-4 pointer-events-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Pulsing Success Badge */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        </div>

        {/* Member Photo */}
        <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-emerald-500 shadow-md bg-surface-container flex items-center justify-center">
          {photo && photo !== "default-image.jpg" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-bold text-lg text-primary">{initials}</span>
          )}
        </div>

        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {method === "QR" ? "QR Pass Validated" : "Manual Entry Approved"}
          </span>
          <h3 className="font-headline text-xl font-black text-on-surface mt-1.5">
            Welcome, {member.firstName || fullName}!
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
            {visit.membership?.plan?.planName || "Active Membership"} • Facility Access Granted
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
        >
          {t("done") || "Done"}
        </button>
      </div>
    </div>
  );
}
