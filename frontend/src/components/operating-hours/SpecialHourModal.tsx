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
  CalendarDays,
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
        // Format dates if they come with time
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
        toast.success(t("specialHourSaved"));
      } else {
        await createSpecialHour(payload);
        toast.success(t("specialHourSaved"));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-surface-bright rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col z-10 animate-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className="bg-linear-to-r from-amber-600 to-rose-600 p-6 text-white relative overflow-hidden flex items-center justify-between">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-xs shadow-inner">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-headline text-xl font-bold leading-tight">
                {isEditing ? t("editSpecialHour") : t("addSpecialHour")}
              </h2>
              <p className="text-white/80 text-xs mt-0.5">
                {isEditing
                  ? t("specialHoursSubtitle")
                  : t("clickAddSpecialHour")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="relative z-10 p-2 hover:bg-white/20 rounded-full transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Glow accents */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 md:p-8 space-y-6 bg-surface-container-lowest overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar"
        >
          {/* Quick Date Presets */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Presets:
              </span>
              <button
                type="button"
                onClick={() => setDatePreset(0, 1)}
                className="text-xs px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDatePreset(1, 1)}
                className="text-xs px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface transition-colors cursor-pointer"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setDatePreset(7, 1)}
                className="text-xs px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface transition-colors cursor-pointer"
              >
                In 1 Week
              </button>
              <button
                type="button"
                onClick={() => setDatePreset(0, 3)}
                className="text-xs px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface transition-colors cursor-pointer"
              >
                3-Day Holiday
              </button>
            </div>

            {/* Date Range Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {t("startDate")} *
                </label>
                <input
                  type="date"
                  {...register("startDate")}
                  className={`w-full px-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                    errors.startDate
                      ? "border-error focus:ring-2 focus:ring-error/20"
                      : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                  }`}
                />
                {errors.startDate && (
                  <p className="text-xs text-error mt-0.5">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {t("endDate")} *
                </label>
                <input
                  type="date"
                  {...register("endDate")}
                  className={`w-full px-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                    errors.endDate
                      ? "border-error focus:ring-2 focus:ring-error/20"
                      : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                  }`}
                />
                {errors.endDate && (
                  <p className="text-xs text-error mt-0.5">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Closure Scope Toggle */}
          <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-bright space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    watchedFullDay
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-primary-container text-primary"
                  }`}
                >
                  {watchedFullDay ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">
                    {watchedFullDay
                      ? t("fullDayClosure")
                      : t("partialClosure")}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {watchedFullDay
                      ? "The entire gym facility will be closed for the whole day."
                      : "The facility will only be closed during specific hours (e.g. 14:00 to 18:00)."}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register("isFullDay")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
              </label>
            </div>
          </div>

          {/* Specific Closure Hours (when not full day) */}
          {!watchedFullDay && (
            <div className="space-y-4 animate-in fade-in duration-200 p-4 rounded-xl border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Info className="w-4 h-4" />
                <span>Specify the exact hours the facility will be closed:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                    Closure Starts (HH:mm) *
                  </label>
                  <input
                    type="time"
                    {...register("startTime")}
                    className={`w-full px-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                      errors.startTime
                        ? "border-error focus:ring-2 focus:ring-error/20"
                        : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                    }`}
                  />
                  {errors.startTime && (
                    <p className="text-xs text-error mt-0.5">
                      {errors.startTime.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                    Closure Ends (HH:mm) *
                  </label>
                  <input
                    type="time"
                    {...register("endTime")}
                    className={`w-full px-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                      errors.endTime
                        ? "border-error focus:ring-2 focus:ring-error/20"
                        : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                    }`}
                  />
                  {errors.endTime && (
                    <p className="text-xs text-error mt-0.5">
                      {errors.endTime.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Summary Preview Banner */}
          <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/50 text-xs text-on-surface-variant flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-on-surface">Schedule Summary:</p>
              <p className="mt-0.5">
                {watchedFullDay
                  ? `Full facility closure from ${watchedStartDate || "Start Date"} to ${watchedEndDate || "End Date"}.`
                  : `Special closure from ${watchedStartDate || "Start Date"} to ${watchedEndDate || "End Date"} between ${watchedStartTime || "--:--"} and ${watchedEndTime || "--:--"}.`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-amber-600 to-rose-600 text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("saving")}</span>
                </>
              ) : (
                <span>{t("saveSpecialHours")}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
