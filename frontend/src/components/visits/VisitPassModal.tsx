"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  X,
  Clock,
  Calendar,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface VisitPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  visitDateAndTime?: string;
  planName?: string;
}

export default function VisitPassModal({
  isOpen,
  onClose,
  token,
  visitDateAndTime,
  planName,
}: VisitPassModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const dateObj = visitDateAndTime ? new Date(visitDateAndTime) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150"
    >
      <Card className="toota-card border-none shadow-2xl relative w-full max-w-sm sm:max-w-md p-6 sm:p-7 text-center space-y-5 overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close", "Close")}
          className="absolute top-4 end-4 p-1.5 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Sparkles className="size-3.5" />
            <span suppressHydrationWarning>
              {t("checkInQrPass", "Club Check-In Pass")}
            </span>
          </div>
          <h2
            suppressHydrationWarning
            className="text-lg sm:text-xl font-bold tracking-tight text-toota-ink mt-2"
          >
            {t("yourWorkoutPass", "Your Workout Pass")}
          </h2>
          <p
            suppressHydrationWarning
            className="text-xs text-toota-muted max-w-xs mx-auto leading-relaxed"
          >
            {t(
              "scanQrAtDesk",
              "Present this QR code to the club front desk scanner upon arrival."
            )}
          </p>
        </div>

        {/* QR Code Container */}
        {token ? (
          <div className="space-y-4">
            <div className="inline-block p-4 sm:p-5 bg-white rounded-3xl shadow-md border border-zinc-200/80 dark:border-zinc-700/50">
              <QRCodeSVG
                value={token}
                size={200}
                level="H"
                includeMargin={false}
                className="w-48 h-48 sm:w-52 sm:h-52"
              />
            </div>

            <p
              suppressHydrationWarning
              className="text-[11px] text-toota-muted font-medium"
            >
              {t(
                "qrPassNotice",
                "Valid for your scheduled visit. Available until check-in."
              )}
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-300 text-xs space-y-2 text-start">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span suppressHydrationWarning>
                {t("noQrPassFound", "Pass not found on this device")}
              </span>
            </div>
            <p suppressHydrationWarning className="leading-relaxed">
              {t(
                "noQrPassFoundDesc",
                "This pass was scheduled on another device or has already been checked in. You can still check in with your Member ID at the front desk."
              )}
            </p>
          </div>
        )}

        {/* Visit Details Strip */}
        {dateObj && (
          <div className="p-3.5 rounded-2xl bg-toota-inner border border-border/40 text-xs text-toota-ink space-y-2">
            <div className="flex items-center justify-between text-toota-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-toota-muted" />
                <span suppressHydrationWarning>{t("date", "Date")}</span>
              </span>
              <span className="font-semibold text-toota-ink">
                {dateObj.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center justify-between text-toota-muted">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-toota-muted" />
                <span suppressHydrationWarning>{t("time", "Time")}</span>
              </span>
              <span className="font-mono font-bold text-toota-ink">
                {dateObj.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {planName && (
              <div className="flex items-center justify-between text-toota-muted pt-1 border-t border-border/30">
                <span suppressHydrationWarning>{t("membershipPlan", "Plan")}</span>
                <span className="font-medium text-toota-ink truncate max-w-[180px]">
                  {planName}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer Action */}
        <Button
          type="button"
          onClick={onClose}
          className="toota-pill w-full h-11 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <span suppressHydrationWarning>{t("done", "Done")}</span>
        </Button>
      </Card>
    </div>
  );
}
