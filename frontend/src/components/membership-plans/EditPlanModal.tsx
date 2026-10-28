"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Save,
  Loader2,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { updateMembershipPlan } from "@/lib/api/membership-plans";
import { MembershipPlan } from "@/types/membership-plan";
import {
  updateMembershipPlanSchema,
  UpdateMembershipPlanFormValues,
} from "@/schemas/membership-plan";

interface EditPlanModalProps {
  plan: MembershipPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPlanModal({
  plan,
  isOpen,
  onClose,
  onSuccess,
}: EditPlanModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateMembershipPlanFormValues>({
    resolver: zodResolver(updateMembershipPlanSchema),
    defaultValues: {
      planName: "",
      description: "",
      weeklyVisitLimit: 7,
      isActive: true,
    },
  });

  const weeklyVisitLimit = watch("weeklyVisitLimit");
  const isActive = watch("isActive");

  useEffect(() => {
    if (plan) {
      reset({
        planName: plan.planName || "",
        description: plan.description || "",
        weeklyVisitLimit: plan.weeklyVisitLimit || 7,
        isActive: plan.isActive ?? true,
      });
    }
  }, [plan, reset]);

  if (!isOpen || !plan) return null;

  const onSubmit = async (values: UpdateMembershipPlanFormValues) => {
    setIsSubmitting(true);
    try {
      await updateMembershipPlan(plan.id, {
        planName: values.planName.trim(),
        description: values.description ? values.description.trim() : undefined,
        weeklyVisitLimit: Number(values.weeklyVisitLimit),
        isActive: values.isActive,
      });

      toast.success(`Plan "${values.planName}" updated successfully!`);
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
        toast.error("Failed to update plan details. Please check inputs.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg text-on-surface">
                {t("editPlan")}
              </h2>
              <p className="text-xs text-on-surface-variant font-mono">
                {plan.planName}
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
          {/* Plan Status (Active / Inactive) with Red and Green indicator */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-on-surface">{t("status")}</p>
              <p className="text-[11px] text-on-surface-variant">
                {isActive ? t("active") : t("inactive")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setValue("isActive", !isActive)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              <span>{isActive ? t("active") : t("inactive")}</span>
            </button>
          </div>

          {/* Plan Name */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              {t("planName")} <span className="text-error">*</span>
            </label>
            <input
              type="text"
              {...register("planName")}
              className={`w-full px-3.5 py-2.5 bg-surface-container-low border ${
                errors.planName
                  ? "border-error focus:ring-error"
                  : "border-outline-variant focus:ring-primary-container"
              } rounded-xl text-sm text-on-surface focus:ring-2 outline-none transition-all`}
            />
            {errors.planName && (
              <p className="text-xs text-error mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.planName.message}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              {t("description")}
            </label>
            <textarea
              rows={2}
              {...register("description")}
              className={`w-full px-3.5 py-2 bg-surface-container-low border ${
                errors.description
                  ? "border-error focus:ring-error"
                  : "border-outline-variant focus:ring-primary-container"
              } rounded-xl text-sm text-on-surface focus:ring-2 outline-none transition-all resize-none`}
            />
            {errors.description && (
              <p className="text-xs text-error mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.description.message}</span>
              </p>
            )}
          </div>

          {/* Weekly Visit Limit */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-on-surface">
                {t("weeklyVisitLimit")} <span className="text-error">*</span>
              </label>
              <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                {weeklyVisitLimit === 7 ? t("unlimitedVisits") : `${weeklyVisitLimit} ${t("visitsPerWeek")}`}
              </span>
            </div>

            <input type="hidden" {...register("weeklyVisitLimit", { valueAsNumber: true })} />

            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setValue("weeklyVisitLimit", num, { shouldValidate: true, shouldDirty: true })}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    Number(weeklyVisitLimit) === num
                      ? "primary-gradient text-white border-transparent shadow-sm scale-102"
                      : "bg-surface-container-low text-on-surface border-outline-variant hover:bg-surface-container"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            {errors.weeklyVisitLimit && (
              <p className="text-xs text-error mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.weeklyVisitLimit.message}</span>
              </p>
            )}
          </div>

          {/* Footer Actions */}
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
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{t("saveChanges")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
