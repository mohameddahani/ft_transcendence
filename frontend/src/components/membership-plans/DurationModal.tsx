"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Plus,
  Save,
  Loader2,
  Clock,
  Coins,
  AlertCircle,
  Calendar,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    watch,
    formState: { errors },
  } = useForm<DurationFormValues>({
    resolver: zodResolver(durationSchema),
    defaultValues: {
      durationDays: 30,
      price: 50,
      priceByG: 50,
    },
  });

  const durationDays = watch("durationDays");
  const price = watch("price");

  useEffect(() => {
    if (durationToEdit) {
      const p = Number(durationToEdit.price);
      reset({
        durationDays: Number(durationToEdit.durationDays),
        price: p,
        priceByG: durationToEdit.priceByG
          ? Number(durationToEdit.priceByG)
          : Math.max(1, Math.round(p)),
      });
    } else {
      reset({
        durationDays: 30,
        price: 50,
        priceByG: 50,
      });
    }
  }, [durationToEdit, reset]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

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
      const priceVal = Number(values.price);
      const priceByGVal = values.priceByG
        ? Math.max(1, Math.round(Number(values.priceByG)))
        : Math.max(1, Math.round(priceVal));

      if (isEditing && durationToEdit) {
        await updateMembershipPlanDuration(durationToEdit.id, {
          membershipPlanId: plan.id,
          durationDays: Number(values.durationDays),
          price: priceVal,
          priceByG: priceByGVal,
        });
        toast.success(
          t("durationUpdatedSuccess", {
            defaultValue: "Duration tier updated successfully!",
          })
        );
      } else {
        await addMembershipPlanDuration({
          membershipPlanId: plan.id,
          durationDays: Number(values.durationDays),
          price: priceVal,
          priceByG: priceByGVal,
        });
        toast.success(
          t("durationAddedSuccess", {
            defaultValue: `Added ${values.durationDays}-day duration to "${plan.planName}"!`,
            days: values.durationDays,
            name: plan.planName,
          })
        );
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
        toast.error(
          t("durationSaveFailed", {
            defaultValue: "Failed to save duration. Please check your inputs.",
          })
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="duration-modal-title"
    >
      <div
        className="w-full max-w-md toota-card border-none shadow-2xl overflow-hidden p-6 sm:p-7 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pb-5 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-toota-inner flex items-center justify-center text-toota-ink shrink-0">
              <Clock className="size-5 text-amber-500" />
            </div>
            <div>
              <h2
                id="duration-modal-title"
                className="text-lg font-semibold text-toota-ink leading-tight"
              >
                {isEditing
                  ? t("editDuration", { defaultValue: "Edit Duration Tier" })
                  : t("addDuration", { defaultValue: "Add Duration Tier" })}
              </h2>
              <p className="text-xs text-toota-muted mt-0.5 truncate max-w-[220px]">
                {plan.planName}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="size-8 rounded-lg text-toota-muted hover:text-toota-ink hover:bg-toota-inner cursor-pointer"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="pt-5 space-y-5">
          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-toota-muted">
              {t("quickPresets", { defaultValue: "Quick Presets" })}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {presets.map((preset) => {
                const isSelected = durationDays === preset.days;
                return (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => {
                      setValue("durationDays", preset.days, { shouldValidate: true });
                    }}
                    className={`h-8 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-toota-side text-white border-toota-side font-semibold"
                        : "bg-toota-inner text-toota-muted border-border/50 hover:text-toota-ink"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration in Days */}
          <div className="space-y-1.5">
            <label
              htmlFor="durationDays"
              className="block text-xs font-semibold uppercase tracking-wider text-toota-muted"
            >
              {t("durationDays") || "Duration (Days)"} <span className="text-toota-red">*</span>
            </label>
            <div className="relative">
              <Calendar className="size-4 absolute start-3 top-1/2 -translate-y-1/2 text-toota-muted pointer-events-none" />
              <Input
                id="durationDays"
                type="number"
                min={1}
                placeholder="30"
                {...register("durationDays", { valueAsNumber: true })}
                className="h-9 rounded-lg bg-toota-inner border-border/40 ps-9 pe-3 text-xs text-toota-ink placeholder:text-toota-muted focus-visible:ring-1 focus-visible:ring-ring"
                disabled={isSubmitting}
              />
            </div>
            {errors.durationDays && (
              <p className="flex items-center gap-1 text-xs text-toota-red font-medium mt-1">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{errors.durationDays.message}</span>
              </p>
            )}
          </div>

          {/* Price (USD) */}
          <div className="space-y-1.5">
            <label
              htmlFor="price"
              className="block text-xs font-semibold uppercase tracking-wider text-toota-muted"
            >
              {t("price") || "Price (USD $)"} <span className="text-toota-red">*</span>
            </label>
            <div className="relative">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-toota-muted font-bold text-xs pointer-events-none">
                $
              </span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min={0.01}
                placeholder="49.99"
                {...register("price", {
                  valueAsNumber: true,
                  onChange: (e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      setValue("priceByG", Math.max(1, Math.round(val)));
                    }
                  },
                })}
                className="h-9 rounded-lg bg-toota-inner border-border/40 ps-7 pe-3 text-xs text-toota-ink placeholder:text-toota-muted focus-visible:ring-1 focus-visible:ring-ring"
                disabled={isSubmitting}
              />
            </div>
            {errors.price && (
              <p className="flex items-center gap-1 text-xs text-toota-red font-medium mt-1">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{errors.price.message}</span>
              </p>
            )}
          </div>

          {/* Price in G Tokens */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="priceByG"
                className="block text-xs font-semibold uppercase tracking-wider text-toota-muted"
              >
                {t("priceInG") || "Price in G Tokens"}
              </label>
              <span className="text-[11px] text-toota-muted">
                {t("autoCalculated") || "Matches USD 1:1"}
              </span>
            </div>
            <div className="relative">
              <Coins className="size-4 absolute start-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" />
              <Input
                id="priceByG"
                type="number"
                step="1"
                min={1}
                placeholder="50"
                {...register("priceByG", { valueAsNumber: true })}
                className="h-9 rounded-lg bg-toota-inner border-border/40 ps-9 pe-3 text-xs text-toota-ink placeholder:text-toota-muted focus-visible:ring-1 focus-visible:ring-ring"
                disabled={isSubmitting}
              />
            </div>
            {errors.priceByG && (
              <p className="flex items-center gap-1 text-xs text-toota-red font-medium mt-1">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{errors.priceByG.message}</span>
              </p>
            )}
          </div>

          {/* Summary Preview Box */}
          <div className="p-3.5 rounded-xl bg-toota-inner border border-border/40 flex items-center justify-between text-xs">
            <span className="text-toota-muted font-medium">
              {t("tierSummary") || "Tier Summary"}:
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-toota-ink">
                {durationDays || 0} {t("days") || "Days"}
              </span>
              <span className="text-toota-muted">•</span>
              <span className="font-semibold text-toota-green">
                ${Number(price || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-border/40 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-lg text-xs font-medium cursor-pointer border-border/50 hover:bg-toota-inner"
            >
              {t("cancel") || "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-5 rounded-lg text-xs font-semibold cursor-pointer bg-toota-side text-white hover:bg-black"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin me-2" />
                  <span>{t("saving") || "Saving..."}</span>
                </>
              ) : isEditing ? (
                <>
                  <Save className="size-3.5 me-2" />
                  <span>{t("saveDuration") || "Save Tier"}</span>
                </>
              ) : (
                <>
                  <Plus className="size-3.5 me-2" />
                  <span>{t("addDuration") || "Add Tier"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
