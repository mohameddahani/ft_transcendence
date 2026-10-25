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

  // Set default minimum date-time to now + 30 minutes in local ISO string for datetime-local
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
      toast.success(t("visitBookedSuccessfully") || "Gym visit booked successfully!", {
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
    toast.info(t("tokenCopied") || "Pass token copied to clipboard!", {
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
      <div className="relative w-full max-w-lg rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleModalClose}
          className="absolute top-5 right-5 rtl:right-auto rtl:left-5 p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {createdToken ? (
          /* Confirmation & Token View */
          <div className="space-y-6 text-center py-2">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold font-headline text-on-surface">
                {t("visitConfirmed") || "Visit Confirmed!"}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {t("visitConfirmedHint") ||
                  "Your gym visit has been reserved. You can present this code at check-in or show your active membership."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-primary" />
                  {t("checkInPassCode") || "Check-In Pass Token"}
                </span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? t("copied") || "Copied" : t("copy") || "Copy"}</span>
                </button>
              </div>

              <div className="p-3 bg-surface-container-lowest rounded-xl font-mono text-xs text-on-surface font-bold break-all select-all border border-outline-variant/40">
                {createdToken}
              </div>
            </div>

            <button
              type="button"
              onClick={handleModalClose}
              className="w-full py-3 primary-gradient text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-all cursor-pointer"
            >
              {t("done") || "Done"}
            </button>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-headline text-on-surface">
                  {t("bookVisitTitle") || "Schedule Gym Visit"}
                </h2>
                <p className="text-xs text-on-surface-variant">
                  {t("bookVisitSubtitle") ||
                    "Select your preferred date and arrival time for workout."}
                </p>
              </div>
            </div>

            {/* Date & Time Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                {t("visitDateAndTime") || "Visit Date & Time"}
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  min={getMinDateTime()}
                  {...register("visitDateAndTime")}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
              {errors.visitDateAndTime && (
                <p className="text-xs text-error font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.visitDateAndTime.message}
                </p>
              )}
            </div>

            {/* Note & Policy Info */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/50 space-y-1.5 text-xs text-on-surface-variant">
              <p className="font-semibold text-on-surface flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                {t("bookingGuidelines") || "Booking Guidelines"}
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                <li>{t("bookingRule1") || "Visits are valid for up to 30 minutes after scheduled time."}</li>
                <li>{t("bookingRule2") || "1 scheduled visit allowed per calendar day."}</li>
                <li>{t("bookingRule3") || "Subject to weekly visit allowance in your membership plan."}</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {t("cancel") || "Cancel"}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 primary-gradient text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("booking") || "Scheduling..."}</span>
                  </>
                ) : (
                  <span>{t("confirmVisit") || "Confirm Visit"}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
