"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Clock,
  Loader2,
  Calendar,
  CheckCircle2,
  Moon,
  Sparkles,
  Save,
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
import { Button } from "@/components/ui/button";

interface WorkingHourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: WorkingHour | null;
  configuredDays?: number[];
  defaultDay?: number;
}

const PRESET_HOURS = [
  { labelKey: "hoursPresetStandard", label: "Standard", start: "06:00", end: "22:00" },
  { labelKey: "hoursPresetExtended", label: "Extended", start: "06:00", end: "23:30" },
  { labelKey: "hoursPresetMorning", label: "Morning", start: "07:00", end: "15:00" },
  { labelKey: "hoursPresetWeekend", label: "Weekend", start: "08:00", end: "20:00" },
];

export default function WorkingHourModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  configuredDays = [],
  defaultDay,
}: WorkingHourModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const daysList = useMemo(
    () => [
      { value: 1, label: t("monday", "Monday") },
      { value: 2, label: t("tuesday", "Tuesday") },
      { value: 3, label: t("wednesday", "Wednesday") },
      { value: 4, label: t("thursday", "Thursday") },
      { value: 5, label: t("friday", "Friday") },
      { value: 6, label: t("saturday", "Saturday") },
      { value: 7, label: t("sunday", "Sunday") },
    ],
    [t]
  );

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
          defaultDay !== undefined
            ? defaultDay
            : daysList.find((d) => !configuredDays.includes(d.value))?.value || 1;
        reset({
          dayOfWeek: nextDay,
          startTime: "07:00",
          endTime: "22:00",
          isClosed: false,
        });
      }
    }
  }, [isOpen, initialData, reset, configuredDays, daysList, defaultDay]);

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
        toast.success(t("operatingHourSaved", "Working hours saved successfully"));
      } else {
        await createWorkingHour({
          dayOfWeek: Number(values.dayOfWeek),
          startTime: values.startTime,
          endTime: values.endTime,
          isClosed: values.isClosed,
        });
        toast.success(t("operatingHourSaved", "Working hours saved successfully"));
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
      <div style={{ background: "var(--card)" }} className="relative w-full min-w-0 max-w-2xl toota-card border border-border/40 p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] z-10 animate-in zoom-in-95 duration-150 flex flex-col bg-card text-toota-ink space-y-6">
        {/* Header with Baseline Metric */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-border/40">
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {isEditing ? t("editWorkingHour", "Edit Working Hours") : t("addWorkingHour", "Add Regular Day")}
              </h3>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {isEditing ? t("updateSchedule", "update schedule") : t("weeklyRoster", "weekly roster")}
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-1">
              {isEditing
                ? t("workingHoursSubtitle", "Update operational hours or mark as closed.")
                : t("clickAddWorkingHour", "Configure weekly schedule and opening hours.")}
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
          className="min-h-0 space-y-6 overflow-y-auto custom-scrollbar pe-1"
        >
          {/* Day of Week Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-toota-ink flex items-center gap-1.5">
              <Calendar className="size-3.5 text-toota-muted" />
              <span>{t("dayOfWeek", "Day of Week")} <span className="text-rose-500">*</span></span>
            </label>

            {/* Quick Day Chips */}
            <div role="group" aria-label={t("dayOfWeek", "Day of Week")} className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {daysList.map((day) => {
                const isSelected = watchedDayOfWeek === day.value;
                const isConfigured =
                  !isEditing && configuredDays.includes(day.value);

                return (
                  <button
                    key={day.value}
                    type="button"
                    aria-label={day.label}
                    title={day.label}
                    aria-pressed={isSelected}
                    disabled={isConfigured || isEditing}
                    onClick={() => setValue("dayOfWeek", day.value)}
                    className={`min-h-11 py-2 px-1 text-xs font-semibold rounded-xl border text-center transition-colors flex flex-col items-center justify-center gap-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-toota-lime text-toota-side border-toota-lime shadow-xs"
                        : isConfigured
                        ? "opacity-40 line-through bg-toota-inner/40 text-toota-muted border-transparent cursor-not-allowed"
                        : "bg-toota-pill border-border/50 text-toota-ink enabled:hover:border-toota-lime enabled:hover:bg-toota-lime/15"
                    }`}
                  >
                    <span>{day.label.slice(0, 3)}</span>
                    {isConfigured && (
                      <span className="text-[9px] uppercase tracking-tighter opacity-70">
                        {t("statusSaved", "Set")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <input type="hidden" {...register("dayOfWeek", { valueAsNumber: true })} />
            {errors.dayOfWeek && (
              <p className="text-[11px] text-rose-500 mt-0.5">
                {errors.dayOfWeek.message}
              </p>
            )}
          </div>

          {/* Closed Toggle Switch */}
          <div className="p-4 rounded-xl border border-border/40 toota-inner flex items-center justify-between gap-3 transition-colors">
            <div className="flex min-w-0 items-center gap-3">
              <div className="size-9 shrink-0 rounded-xl bg-card border border-border/40 flex items-center justify-center text-toota-ink shadow-inner">
                {watchedClosed ? (
                  <Moon className="size-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-toota-ink">
                  {t("markFacilityClosed", "Mark Facility as Closed")}
                </p>
                <p className="text-[11px] text-toota-muted">
                  {watchedClosed
                    ? t("facilityClosedTooltip", "Facility is closed; check-ins disabled on this day")
                    : t("facilityOpenTooltip", "Standard check-in hours and access apply")}
                </p>
              </div>
            </div>

            <label className="relative inline-flex shrink-0 items-center cursor-pointer">
              <input
                type="checkbox"
                {...register("isClosed")}
                className="sr-only peer"
                aria-label={t("markFacilityClosed", "Mark Facility as Closed")}
              />
              <div className="w-11 h-6 bg-border/60 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500" />
            </label>
          </div>

          {/* Time Fields (Only if not closed) */}
          {!watchedClosed && (
            <div className="space-y-4 animate-in fade-in-0 duration-150">
              {/* Presets */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-toota-muted flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-toota-ink" aria-hidden="true" />
                  {t("quickPresets", "Quick Presets")}
                </span>
                <div role="group" aria-label={t("quickPresets", "Quick Presets")} className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
                  {PRESET_HOURS.map((preset) => {
                    const isSelected = watchedStartTime === preset.start && watchedEndTime === preset.end;
                    return (
                      <button
                        key={preset.labelKey}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setValue("startTime", preset.start);
                          setValue("endTime", preset.end);
                        }}
                        className={`min-w-0 rounded-xl border px-3 py-2.5 text-start transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                          isSelected
                            ? "bg-toota-lime text-toota-side border-toota-lime shadow-xs"
                            : "bg-toota-pill text-toota-ink border-border/50 hover:border-toota-lime hover:bg-toota-lime/15"
                        }`}
                      >
                        <span className="block text-xs font-semibold">{t(preset.labelKey, preset.label)}</span>
                        <span dir="ltr" className="mt-1 block text-[11px] font-mono tabular-nums">{preset.start} – {preset.end}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("openTime", "Opening Time")} (HH:mm) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="size-3.5 absolute start-3.5 top-1/2 -translate-y-1/2 text-toota-muted pointer-events-none" />
                    <input
                      type="time"
                      {...register("startTime")}
                      className={`min-w-0 w-full h-10 ps-10 pe-3.5 rounded-xl bg-card border text-xs font-mono font-medium text-toota-ink outline-none transition-all cursor-pointer ${
                        errors.startTime
                          ? "border-rose-500 focus:ring-1 focus:ring-rose-500"
                          : "border-border/40 focus:ring-1 focus:ring-ring"
                      }`}
                    />
                  </div>
                  {errors.startTime && (
                    <p className="text-[11px] text-rose-500 mt-0.5">
                      {errors.startTime.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-toota-ink">
                    {t("closeTime", "Closing Time")} (HH:mm) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="size-3.5 absolute start-3.5 top-1/2 -translate-y-1/2 text-toota-muted pointer-events-none" />
                    <input
                      type="time"
                      {...register("endTime")}
                      className={`min-w-0 w-full h-10 ps-10 pe-3.5 rounded-xl bg-card border text-xs font-mono font-medium text-toota-ink outline-none transition-all cursor-pointer ${
                        errors.endTime
                          ? "border-rose-500 focus:ring-1 focus:ring-rose-500"
                          : "border-border/40 focus:ring-1 focus:ring-ring"
                      }`}
                    />
                  </div>
                  {errors.endTime && (
                    <p className="text-[11px] text-rose-500 mt-0.5">
                      {errors.endTime.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Live Hours Calculation Card */}
              {durationStr && (
                <div className="flex items-center gap-2 p-3 rounded-xl toota-inner border border-border/40 text-xs text-toota-ink">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                  <span>
                    Facility operates for <strong className="font-mono">{durationStr}</strong> on this day ({watchedStartTime} to {watchedEndTime}).
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Form Actions (Unified Toota Pill Outline Buttons) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-auto min-h-11 w-full rounded-full bg-toota-pill px-4 py-2 text-xs font-semibold whitespace-normal cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
            >
              <span>{t("cancel", "Cancel")}</span>
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting}
              className="h-auto min-h-11 w-full rounded-full bg-toota-pill px-4 py-2 text-xs font-semibold whitespace-normal cursor-pointer border border-border/50 hover:bg-toota-inner text-toota-ink"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin me-1.5" />
                  <span>{t("saving", "Saving...")}</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5 me-1.5" />
                  <span>{isEditing ? t("saveWorkingHours", "Save Working Hours") : t("addRegularDay", "Add Regular Day")}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
