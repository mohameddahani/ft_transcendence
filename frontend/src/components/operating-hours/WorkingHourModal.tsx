"use client";

import React, { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Clock,
  Loader2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Moon,
  Sparkles,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { WorkingHour } from "@/types/working-hours";
import {
  addWorkingHourSchema,
  AddWorkingHourFormValues,
} from "@/schemas/working-hours";
import {
  createWorkingHour,
  updateWorkingHour,
} from "@/lib/api/working-hours";

interface WorkingHourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: WorkingHour | null;
  configuredDays?: number[];
}

const PRESET_HOURS = [
  { label: "Standard (06:00 - 22:00)", start: "06:00", end: "22:00" },
  { label: "Extended (06:00 - 23:30)", start: "06:00", end: "23:30" },
  { label: "Morning (07:00 - 15:00)", start: "07:00", end: "15:00" },
  { label: "Weekend (08:00 - 20:00)", start: "08:00", end: "20:00" },
];

export default function WorkingHourModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  configuredDays = [],
}: WorkingHourModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const daysList = [
    { value: 1, label: t("monday") },
    { value: 2, label: t("tuesday") },
    { value: 3, label: t("wednesday") },
    { value: 4, label: t("thursday") },
    { value: 5, label: t("friday") },
    { value: 6, label: t("saturday") },
    { value: 7, label: t("sunday") },
  ];

  // Pick first unconfigured day as default if adding
  const firstAvailableDay =
    daysList.find((d) => !configuredDays.includes(d.value))?.value || 1;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<AddWorkingHourFormValues>({
    resolver: zodResolver(addWorkingHourSchema),
    defaultValues: {
      dayOfWeek: initialData ? initialData.dayOfWeek : firstAvailableDay,
      startTime: initialData ? initialData.startTime : "07:00",
      endTime: initialData ? initialData.endTime : "22:00",
      isClosed: initialData ? initialData.isClosed : false,
    },
  });

  const watchedClosed = useWatch({ control, name: "isClosed" });
  const watchedStartTime = useWatch({ control, name: "startTime" });
  const watchedEndTime = useWatch({ control, name: "endTime" });
  const watchedDayOfWeek = useWatch({ control, name: "dayOfWeek" });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          dayOfWeek: initialData.dayOfWeek,
          startTime: initialData.startTime || "07:00",
          endTime: initialData.endTime || "22:00",
          isClosed: !!initialData.isClosed,
        });
      } else {
        const nextDay =
          daysList.find((d) => !configuredDays.includes(d.value))?.value || 1;
        reset({
          dayOfWeek: nextDay,
          startTime: "07:00",
          endTime: "22:00",
          isClosed: false,
        });
      }
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  // Calculate duration display
  const calculateDuration = () => {
    if (watchedClosed) return null;
    if (!watchedStartTime || !watchedEndTime) return null;
    const [sh, sm] = watchedStartTime.split(":").map(Number);
    const [eh, em] = watchedEndTime.split(":").map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
    const totalMinutes = eh * 60 + em - (sh * 60 + sm);
    if (totalMinutes <= 0) return null;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
  };

  const durationStr = calculateDuration();

  const onSubmit = async (values: AddWorkingHourFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await updateWorkingHour(initialData.id, {
          startTime: values.startTime,
          endTime: values.endTime,
          isClosed: values.isClosed,
          dayOfWeek: Number(values.dayOfWeek),
        });
        toast.success(t("operatingHourSaved"));
      } else {
        await createWorkingHour({
          dayOfWeek: Number(values.dayOfWeek),
          startTime: values.startTime,
          endTime: values.endTime,
          isClosed: values.isClosed,
        });
        toast.success(t("operatingHourSaved"));
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
        toast.error("Failed to save working hours. Please check all fields.");
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
        <div className="primary-gradient p-6 text-white relative overflow-hidden flex items-center justify-between">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-xs shadow-inner">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-headline text-xl font-bold leading-tight">
                {isEditing ? t("editWorkingHour") : t("addWorkingHour")}
              </h2>
              <p className="text-white/80 text-xs mt-0.5">
                {isEditing
                  ? t("workingHoursSubtitle")
                  : t("clickAddWorkingHour")}
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
          {/* Day of Week Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {t("dayOfWeek")} *
            </label>

            {/* Quick Day Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {daysList.map((day) => {
                const isSelected = watchedDayOfWeek === day.value;
                const isConfigured =
                  !isEditing && configuredDays.includes(day.value);

                return (
                  <button
                    key={day.value}
                    type="button"
                    disabled={isConfigured || isEditing}
                    onClick={() => setValue("dayOfWeek", day.value)}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      isSelected
                        ? "bg-primary text-on-primary border-primary shadow-sm ring-2 ring-primary/20"
                        : isConfigured
                        ? "bg-surface-container-high/50 text-on-surface-variant/40 border-outline-variant/30 cursor-not-allowed line-through"
                        : "bg-surface-bright text-on-surface hover:bg-surface-container border-outline-variant/60"
                    }`}
                  >
                    <span>{day.label.slice(0, 3)}</span>
                    {isConfigured && (
                      <span className="text-[9px] uppercase tracking-tighter opacity-70">
                        {t("statusSaved") || "Set"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <input type="hidden" {...register("dayOfWeek", { valueAsNumber: true })} />
            {errors.dayOfWeek && (
              <p className="text-xs text-error mt-0.5">
                {errors.dayOfWeek.message}
              </p>
            )}
          </div>

          {/* Closed Toggle Switch */}
          <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-bright flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  watchedClosed
                    ? "bg-error-container text-error"
                    : "bg-primary-container text-primary"
                }`}
              >
                {watchedClosed ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">
                  {t("markFacilityClosed")}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {watchedClosed
                    ? t("facilityClosedTooltip") ||
                      "Members and staff cannot check in or access on this day"
                    : t("facilityOpenTooltip") ||
                      "Standard check-in hours and access will apply"}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register("isClosed")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-error" />
            </label>
          </div>

          {/* Time Fields (Only if not closed) */}
          {!watchedClosed && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" /> Presets:
                </span>
                {PRESET_HOURS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setValue("startTime", preset.start);
                      setValue("endTime", preset.end);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                    {t("openTime")} (HH:mm) *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    <input
                      type="time"
                      {...register("startTime")}
                      className={`w-full pl-10 pr-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                        errors.startTime
                          ? "border-error focus:ring-2 focus:ring-error/20"
                          : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                      }`}
                    />
                  </div>
                  {errors.startTime && (
                    <p className="text-xs text-error mt-0.5">
                      {errors.startTime.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                    {t("closeTime")} (HH:mm) *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                    <input
                      type="time"
                      {...register("endTime")}
                      className={`w-full pl-10 pr-3.5 py-2.5 bg-surface-bright border rounded-xl text-sm font-medium text-on-surface outline-none transition-all ${
                        errors.endTime
                          ? "border-error focus:ring-2 focus:ring-error/20"
                          : "border-outline-variant focus:ring-2 focus:ring-primary-container"
                      }`}
                    />
                  </div>
                  {errors.endTime && (
                    <p className="text-xs text-error mt-0.5">
                      {errors.endTime.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Live Hours Calculation Pill */}
              {durationStr && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Facility operates for <strong>{durationStr}</strong> on this day ({watchedStartTime} to {watchedEndTime}).
                  </span>
                </div>
              )}
            </div>
          )}

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
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-md hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("saving")}</span>
                </>
              ) : (
                <span>{t("saveWorkingHours")}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
