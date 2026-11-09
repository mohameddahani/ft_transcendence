"use client";

import React, { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Calendar,
  Clock,
  Loader2,
  AlertTriangle,
  Sparkles,
  Info,
  Save,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { SpecialHour } from "@/types/working-hours";
import {
  addSpecialHourSchema,
  AddSpecialHourFormValues,
} from "@/schemas/working-hours";
import {
  createSpecialHour,
  updateSpecialHour,
} from "@/lib/api/working-hours";
import { Button } from "@/components/ui/button";

interface SpecialHourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: SpecialHour | null;
}

export default function SpecialHourModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: SpecialHourModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const todayStr = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<AddSpecialHourFormValues>({
    resolver: zodResolver(addSpecialHourSchema),
    defaultValues: {
      startDate: todayStr,
      endDate: todayStr,
      isFullDay: true,
      startTime: "",
      endTime: "",
    },
  });

  const watchedFullDay = useWatch({ control, name: "isFullDay" });
  const watchedStartDate = useWatch({ control, name: "startDate" });
  const watchedEndDate = useWatch({ control, name: "endDate" });
  const watchedStartTime = useWatch({ control, name: "startTime" });
  const watchedEndTime = useWatch({ control, name: "endTime" });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const isFull = !initialData.startTime && !initialData.endTime;
        const start = initialData.startDate ? initialData.startDate.split("T")[0] : todayStr;
        const end = initialData.endDate ? initialData.endDate.split("T")[0] : start;

        reset({
          startDate: start,
          endDate: end,
          isFullDay: isFull,
          startTime: initialData.startTime || "",
          endTime: initialData.endTime || "",
        });
      } else {
        reset({
          startDate: todayStr,
          endDate: todayStr,
          isFullDay: true,
          startTime: "",
          endTime: "",
        });
      }
    }
  }, [isOpen, initialData, reset, todayStr]);

  if (!isOpen) return null;

  // Preset Date Helper
  const setDatePreset = (daysOffset: number, durationDays: number = 1) => {
    const start = new Date();
    start.setDate(start.getDate() + daysOffset);
    const startISO = start.toISOString().split("T")[0];

    const end = new Date(start);
    end.setDate(end.getDate() + (durationDays - 1));
    const endISO = end.toISOString().split("T")[0];

    setValue("startDate", startISO);
    setValue("endDate", endISO);
  };

  const onSubmit = async (values: AddSpecialHourFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        startDate: values.startDate,
        endDate: values.endDate,
        startTime: values.isFullDay ? null : values.startTime || null,
        endTime: values.isFullDay ? null : values.endTime || null,
      };

      if (isEditing && initialData) {
        await updateSpecialHour(initialData.id, payload);
        toast.success(t("specialHourSaved", "Special closure updated successfully"));
      } else {
        await createSpecialHour(payload);
        toast.success(t("specialHourSaved", "Special closure scheduled successfully"));
      }

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        const msg = err.response.data.message;
        if (Array.isArray(msg)) {
          msg.forEach((m) => toast.error(m));
        } else {
          toast.error(msg);
        }
      } else {
        toast.error("Failed to save special hours. Please check all fields.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="relative w-full max-w-2xl toota-card border border-border/40 p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] z-10 animate-in zoom-in-95 duration-150 flex flex-col bg-card text-toota-ink space-y-6">
        {/* Header with Baseline Metric */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-border/40">
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {isEditing ? t("editSpecialHour", "Edit Special Closure") : t("addSpecialHour", "Add Special Closure")}
              </h3>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {t("overrideSchedule", "closure override")}
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-1">
              {isEditing
                ? t("specialHoursSubtitle", "Update scheduled closure dates and modified hours.")
                : t("clickAddSpecialHour", "Schedule temporary facility closures or holiday hours.")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 overflow-y-auto custom-scrollbar pr-1"
        >
          {/* Quick Date Presets */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-toota-muted uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="size-3 text-toota-ink" /> Presets:
              </span>
              <button
                type="button"
                onClick={() => setDatePreset(0, 1)}
                className="toota-pill h-7 px-2.5 text-[11px] font-mono border border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDatePreset(1, 1)}
                className="toota-pill h-7 px-2.5 text-[11px] font-mono border border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer transition-colors"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setDatePreset(7, 1)}
                className="toota-pill h-7 px-2.5 text-[11px] font-mono border border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer transition-colors"
              >
                In 1 Week
              </button>
              <button
                type="button"
                onClick={() => setDatePreset(0, 3)}
                className="toota-pill h-7 px-2.5 text-[11px] font-mono border border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer transition-colors"
              >
                3-Day Holiday
              </button>
            </div>

            {/* Date Range Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-toota-ink flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-toota-muted" />
                  <span>{t("startDate", "Start Date")} <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="date"
                  {...register("startDate")}
                  className={`w-full h-10 px-3.5 rounded-xl bg-card border text-xs font-mono font-medium text-toota-ink outline-none transition-all cursor-pointer ${
                    errors.startDate
                      ? "border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-border/40 focus:ring-1 focus:ring-ring"
                  }`}
                />
                {errors.startDate && (
                  <p className="text-[11px] text-rose-500 mt-0.5">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-toota-ink flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-toota-muted" />
                  <span>{t("endDate", "End Date")} <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="date"
                  {...register("endDate")}
                  className={`w-full h-10 px-3.5 rounded-xl bg-card border text-xs font-mono font-medium text-toota-ink outline-none transition-all cursor-pointer ${
                    errors.endDate
                      ? "border-rose-500 focus:ring-1 focus:ring-rose-500"
                      : "border-border/40 focus:ring-1 focus:ring-ring"
                  }`}
                />
                {errors.endDate && (
                  <p className="text-[11px] text-rose-500 mt-0.5">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Closure Scope Toggle */}
          <div className="p-4 rounded-xl border border-border/40 toota-inner flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-card border border-border/40 flex items-center justify-center text-toota-ink shadow-inner">
                {watchedFullDay ? (
                  <AlertTriangle className="size-4 text-amber-500" />
                ) : (
                  <Clock className="size-4 text-toota-ink" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-toota-ink">
                  {watchedFullDay
                    ? t("fullDayClosure", "Full-Day Closure")
                    : t("partialClosure", "Partial-Day Hours Override")}
                </p>
                <p className="text-[11px] text-toota-muted">
                  {watchedFullDay
                    ? "The facility will remain completely closed on the selected date(s)."
                    : "The facility will be closed only during the specific timeframe entered below."}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register("isFullDay")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
            </label>
          </div>

          {/* Specific Closure Hours (when not full day) */}
          {!watchedFullDay && (
            <div className="space-y-4 animate-in fade-in-0 duration-150 p-4 rounded-xl border border-border/40 toota-inner">
              <div className="flex items-center gap-2 text-xs font-medium text-toota-ink">
                <Info className="size-3.5 text-toota-muted" />
                <span>Specify the exact closed window:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    Closure Starts (HH:mm) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    {...register("startTime")}
                    className={`w-full h-10 px-3.5 rounded-xl bg-card border text-xs font-mono font-medium text-toota-ink outline-none transition-all cursor-pointer ${
                      errors.startTime
                        ? "border-rose-500 focus:ring-1 focus:ring-rose-500"
                        : "border-border/40 focus:ring-1 focus:ring-ring"
                    }`}
                  />
                  {errors.startTime && (
                    <p className="text-[11px] text-rose-500 mt-0.5">
                      {errors.startTime.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    Closure Ends (HH:mm) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    {...register("endTime")}
                    className={`w-full h-10 px-3.5 rounded-xl bg-card border text-xs font-mono font-medium text-toota-ink outline-none transition-all cursor-pointer ${
                      errors.endTime
                        ? "border-rose-500 focus:ring-1 focus:ring-rose-500"
                        : "border-border/40 focus:ring-1 focus:ring-ring"
                    }`}
                  />
                  {errors.endTime && (
                    <p className="text-[11px] text-rose-500 mt-0.5">
                      {errors.endTime.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Summary Preview Banner */}
          <div className="p-3.5 rounded-xl toota-inner border border-border/40 text-xs text-toota-muted flex items-start gap-2.5">
            <Info className="size-4 text-toota-ink shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-toota-ink">Schedule Summary:</p>
              <p className="mt-0.5">
                {watchedFullDay
                  ? `Full facility closure from ${watchedStartDate || "Start Date"} to ${watchedEndDate || "End Date"}.`
                  : `Special closure from ${watchedStartDate || "Start Date"} to ${watchedEndDate || "End Date"} between ${watchedStartTime || "--:--"} and ${watchedEndTime || "--:--"}.`}
              </p>
            </div>
          </div>

          {/* Form Actions (Unified Toota Pill Outline Buttons) */}
          <div className="flex items-center gap-3 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="toota-pill flex-1 h-11 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
            >
              <span>{t("cancel", "Cancel")}</span>
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting}
              className="toota-pill flex-1 h-11 text-xs font-semibold cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin me-1.5" />
                  <span>{t("saving", "Saving...")}</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5 me-1.5" />
                  <span>{isEditing ? t("saveSpecialHours", "Save Special Closure") : t("addSpecialClosure", "Add Special Closure")}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
