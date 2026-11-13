"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { bookVisitSchema, BookVisitFormValues } from "@/schemas/visits";
import { createMemberVisit } from "@/lib/api/member-portal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BookVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookVisitModal({
  isOpen,
  onClose,
  onSuccess,
}: BookVisitModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Set default minimum date-time to now + 15 minutes in local ISO string for datetime-local
  const getMinDateTime = () => {
    const d = new Date(Date.now() + 15 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookVisitFormValues>({
    resolver: zodResolver(bookVisitSchema),
    defaultValues: {
      visitDateAndTime: getMinDateTime(),
    },
  });

  if (!isOpen) return null;

  const handleModalClose = () => {
    reset();
    setCreatedToken(null);
    setIsCopied(false);
    onClose();
  };

  const onSubmit = async (values: BookVisitFormValues) => {
    setIsSubmitting(true);
    try {
      const isoDate = new Date(values.visitDateAndTime).toISOString();
      const res = await createMemberVisit(isoDate);
      toast.success(t("visitBookedSuccessfully", "Gym visit booked successfully!"), {
        position: "top-right",
      });
      if (res?.rawToken) {
        setCreatedToken(res.rawToken);
      }
      onSuccess();
      if (!res?.rawToken) {
        handleModalClose();
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Failed to book gym visit";
      toast.error(msg || "Failed to book visit", {
        position: "top-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyToken = () => {
    if (!createdToken) return;
    navigator.clipboard.writeText(createdToken);
    setIsCopied(true);
    toast.info(t("tokenCopied", "Pass token copied to clipboard!"), {
      position: "top-right",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150"
    >
      <Card className="toota-card border-none shadow-2xl relative w-full max-w-lg p-6 sm:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleModalClose}
          className="absolute top-5 end-5 p-1.5 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {createdToken ? (
          /* Confirmation & Token View */
          <div className="space-y-6 text-center py-2">
            <div className="size-16 rounded-3xl bg-toota-inner text-toota-green flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="size-8" />
            </div>

            <div className="space-y-1">
              <h2
                suppressHydrationWarning
                className="text-xl font-bold tracking-tight text-toota-ink"
              >
                {t("visitConfirmed", "Visit Confirmed!")}
              </h2>
              <p
                suppressHydrationWarning
                className="text-xs text-toota-muted max-w-sm mx-auto"
              >
                {t(
                  "visitConfirmedHint",
                  "Your gym visit has been reserved. You can present this code at check-in or show your active membership."
                )}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-toota-inner border border-border/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-toota-muted">
                <span className="flex items-center gap-1.5 text-toota-ink">
                  <QrCode className="size-4 text-toota-muted" />
                  <span suppressHydrationWarning>{t("checkInPassCode", "Check-In Pass Token")}</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  {isCopied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  <span suppressHydrationWarning>{isCopied ? t("copied", "Copied") : t("copy", "Copy")}</span>
                </button>
              </div>

              <div className="p-3 bg-card rounded-xl font-mono text-xs text-toota-ink font-bold break-all select-all border border-border/40">
                {createdToken}
              </div>
            </div>

            <Button
              type="button"
              onClick={handleModalClose}
              className="toota-pill w-full h-11 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <span suppressHydrationWarning>{t("done", "Done")}</span>
            </Button>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-toota-inner text-toota-ink flex items-center justify-center shrink-0">
                <Calendar className="size-5" />
              </div>
              <div>
                <h2
                  suppressHydrationWarning
                  className="text-lg font-bold tracking-tight text-toota-ink"
                >
                  {t("bookVisitTitle", "Schedule Gym Visit")}
                </h2>
                <p
                  suppressHydrationWarning
                  className="text-xs text-toota-muted"
                >
                  {t(
                    "bookVisitSubtitle",
                    "Select your preferred date and arrival time for workout."
                  )}
                </p>
              </div>
            </div>

            {/* Date & Time Input */}
            <div className="space-y-2">
              <label
                suppressHydrationWarning
                className="block text-xs font-semibold uppercase tracking-wider text-toota-muted"
              >
                {t("visitDateAndTime", "Visit Date & Time")}
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  min={getMinDateTime()}
                  {...register("visitDateAndTime")}
                  className="w-full px-4 py-2.5 rounded-xl bg-toota-inner border border-border/40 text-toota-ink text-sm font-medium focus:outline-hidden focus:ring-1 focus:ring-zinc-400 transition-all"
                />
              </div>
              {errors.visitDateAndTime && (
                <p className="text-xs text-destructive font-medium flex items-center gap-1">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {errors.visitDateAndTime.message}
                </p>
              )}
            </div>

            {/* Note & Policy Info */}
            <div className="p-4 rounded-2xl bg-toota-inner border border-border/40 space-y-2 text-xs text-toota-muted">
              <p
                suppressHydrationWarning
                className="font-semibold text-toota-ink flex items-center gap-1.5"
              >
                <Clock className="size-3.5 text-toota-muted shrink-0" />
                {t("bookingGuidelines", "Booking Guidelines")}
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                <li suppressHydrationWarning>
                  {t("bookingRule1", "Visits are valid for up to 30 minutes after scheduled time.")}
                </li>
                <li suppressHydrationWarning>
                  {t("bookingRule2", "1 scheduled visit allowed per calendar day.")}
                </li>
                <li suppressHydrationWarning>
                  {t("bookingRule3", "Subject to weekly visit allowance in your membership plan.")}
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleModalClose}
                disabled={isSubmitting}
                className="toota-pill h-10 px-4 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink disabled:opacity-50"
              >
                <span suppressHydrationWarning>{t("cancel", "Cancel")}</span>
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin me-1.5" />
                    <span suppressHydrationWarning>{t("booking", "Scheduling...")}</span>
                  </>
                ) : (
                  <span suppressHydrationWarning>{t("confirmVisit", "Confirm Visit")}</span>
                )}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
