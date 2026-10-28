"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Plus,
  Save,
  Loader2,
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  addMembershipPlanDuration,
  updateMembershipPlanDuration,
} from "@/lib/api/membership-plans";
import {
  MembershipPlan,
  MembershipPlanDuration,
} from "@/types/membership-plan";
import { durationSchema, DurationFormValues } from "@/schemas/membership-plan";

interface DurationModalProps {
  plan: MembershipPlan | null;
  durationToEdit?: MembershipPlanDuration | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DurationModal({
  plan,
  durationToEdit,
  isOpen,
  onClose,
  onSuccess,
}: DurationModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(durationToEdit);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DurationFormValues>({
    resolver: zodResolver(durationSchema),
    defaultValues: {
      durationDays: 30,
      price: 50,
    },
  });

  useEffect(() => {
    if (durationToEdit) {
      reset({
        durationDays: Number(durationToEdit.durationDays),
        price: Number(durationToEdit.price),
      });
    } else {
      reset({
        durationDays: 30,
        price: 50,
      });
    }
  }, [durationToEdit, reset]);

  if (!isOpen || !plan) return null;

  const presets = [
    { label: "1 Month", days: 30 },
    { label: "3 Months", days: 90 },
    { label: "6 Months", days: 180 },
    { label: "1 Year", days: 365 },
  ];

  const onSubmit = async (values: DurationFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing && durationToEdit) {
        await updateMembershipPlanDuration(durationToEdit.id, {
          membershipPlanId: plan.id,
          durationDays: Number(values.durationDays),
          price: Number(values.price),
        });
        toast.success("Duration tier updated successfully!");
      } else {
        await addMembershipPlanDuration({
          membershipPlanId: plan.id,
          durationDays: Number(values.durationDays),
          price: Number(values.price),
        });
        toast.success(`Added ${values.durationDays}-day duration to "${plan.planName}"!`);
      }

      onSuccess();
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
        toast.error("Failed to save duration. Please check your inputs.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div
        className="w-full max-w-md bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg text-on-surface">
                {isEditing ? t("editDuration") : t("addDuration")}
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                {t("planName")}: <span className="font-bold text-primary">{plan.planName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-2">
              {t("durationDays")}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => setValue("durationDays", preset.days)}
                  className="px-2 py-1.5 rounded-xl border border-outline-variant bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-all cursor-pointer text-center"
                >
                  {preset.days} {t("days")}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Days */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              {t("durationDays")} <span className="text-error">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              <input
                type="number"
                min={1}
                {...register("durationDays", { valueAsNumber: true })}
                placeholder="30"
                className={`w-full pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 py-2.5 bg-surface-container-low border ${
                  errors.durationDays
                    ? "border-error focus:ring-error"
                    : "border-outline-variant focus:ring-primary-container"
                } rounded-xl text-sm text-on-surface focus:ring-2 outline-none transition-all`}
              />
            </div>
            {errors.durationDays && (
              <p className="text-xs text-error mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.durationDays.message}</span>
              </p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              {t("price")} <span className="text-error">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              <input
                type="number"
                step="0.01"
                min={0.01}
                {...register("price", { valueAsNumber: true })}
                placeholder="49.99"
                className={`w-full pl-10 rtl:pl-3.5 rtl:pr-10 pr-3.5 py-2.5 bg-surface-container-low border ${
                  errors.price
                    ? "border-error focus:ring-error"
                    : "border-outline-variant focus:ring-primary-container"
                } rounded-xl text-sm text-on-surface focus:ring-2 outline-none transition-all`}
              />
            </div>
            {errors.price && (
              <p className="text-xs text-error mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.price.message}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 primary-gradient text-white text-sm font-bold rounded-xl shadow-md hover:opacity-95 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditing ? (
                <Save className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isEditing ? t("saveChanges") : t("addDuration")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
